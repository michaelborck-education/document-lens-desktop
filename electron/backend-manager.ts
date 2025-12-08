import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import http from 'http'

export interface BackendStatus {
  running: boolean
  url: string | null
  pid?: number
}

export class BackendManager {
  private process: ChildProcess | null = null
  private port: number = 8000
  private host: string = '127.0.0.1'
  private startupTimeout: number = 30000 // 30 seconds
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    // Use a different port range for the embedded backend
    this.port = 8765
  }

  /**
   * Get the path to the bundled backend executable
   */
  private getBackendPath(): string {
    if (app.isPackaged) {
      // In production, the backend is in the resources directory
      const platform = process.platform
      const ext = platform === 'win32' ? '.exe' : ''
      const backendName = `document-lens-api${ext}`
      
      // Check in extraResources
      const resourcesPath = process.resourcesPath
      const backendPath = path.join(resourcesPath, 'backend', backendName)
      
      if (fs.existsSync(backendPath)) {
        return backendPath
      }
      
      // Fallback to app.asar.unpacked if using asar
      const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked', 'backend', backendName)
      if (fs.existsSync(unpackedPath)) {
        return unpackedPath
      }
      
      throw new Error(`Backend executable not found at: ${backendPath}`)
    } else {
      // In development, assume the backend is running externally
      // Return empty string to indicate external backend
      return ''
    }
  }

  /**
   * Start the backend process
   */
  async start(): Promise<void> {
    const backendPath = this.getBackendPath()
    
    if (!backendPath) {
      // Development mode - backend should be running externally
      console.log('Development mode: assuming backend is running externally at http://localhost:8000')
      this.port = 8000
      return
    }

    console.log('Starting backend from:', backendPath)

    // Ensure the backend is executable (Unix)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(backendPath, '755')
      } catch (error) {
        console.warn('Could not set executable permission:', error)
      }
    }

    // Start the backend process
    this.process = spawn(backendPath, ['--port', String(this.port), '--host', this.host], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: {
        ...process.env,
        DOCUMENT_LENS_PORT: String(this.port),
        DOCUMENT_LENS_HOST: this.host
      }
    })

    // Handle stdout
    this.process.stdout?.on('data', (data) => {
      console.log('[Backend]', data.toString().trim())
    })

    // Handle stderr
    this.process.stderr?.on('data', (data) => {
      console.error('[Backend Error]', data.toString().trim())
    })

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code}, signal ${signal}`)
      this.process = null
    })

    // Handle process error
    this.process.on('error', (error) => {
      console.error('Failed to start backend:', error)
      this.process = null
    })

    // Wait for the backend to be ready
    await this.waitForReady()

    // Start health check
    this.startHealthCheck()
  }

  /**
   * Wait for the backend to be ready
   */
  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const check = () => {
        this.healthCheck()
          .then(() => {
            console.log('Backend is ready')
            resolve()
          })
          .catch(() => {
            if (Date.now() - startTime > this.startupTimeout) {
              reject(new Error('Backend startup timeout'))
              return
            }
            // Retry in 500ms
            setTimeout(check, 500)
          })
      }
      
      // Start checking after a short delay
      setTimeout(check, 1000)
    })
  }

  /**
   * Health check - ping the backend
   */
  private healthCheck(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: this.host,
        port: this.port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          resolve(true)
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`))
        }
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Health check timeout'))
      })

      req.end()
    })
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        console.warn('Backend health check failed:', error)
        // Optionally restart the backend here
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Stop the backend process
   */
  async stop(): Promise<void> {
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    if (!this.process) {
      return
    }

    console.log('Stopping backend...')

    return new Promise((resolve) => {
      if (!this.process) {
        resolve()
        return
      }

      // Set up exit handler
      this.process.once('exit', () => {
        this.process = null
        console.log('Backend stopped')
        resolve()
      })

      // Try graceful shutdown first
      if (process.platform === 'win32') {
        this.process.kill()
      } else {
        this.process.kill('SIGTERM')
      }

      // Force kill after timeout
      setTimeout(() => {
        if (this.process) {
          console.log('Force killing backend...')
          this.process.kill('SIGKILL')
        }
      }, 5000)
    })
  }

  /**
   * Get the backend URL
   */
  getUrl(): string {
    return `http://${this.host}:${this.port}`
  }

  /**
   * Get the backend status
   */
  getStatus(): BackendStatus {
    return {
      running: this.process !== null || !app.isPackaged, // In dev, assume running
      url: this.getUrl(),
      pid: this.process?.pid
    }
  }

  /**
   * Check if the backend is running (external or embedded)
   */
  async isRunning(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }
}
