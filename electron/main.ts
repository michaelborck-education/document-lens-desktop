import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDatabase, getDatabase } from './database'
import { BackendManager } from './backend-manager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged 
  ? process.env.DIST 
  : path.join(__dirname, '../public')

let mainWindow: BrowserWindow | null = null
let backendManager: BackendManager | null = null

// Vite dev server URL
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // Required for better-sqlite3
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

// Initialize app
app.whenReady().then(async () => {
  // Initialize database
  initDatabase()

  // Initialize backend manager
  backendManager = new BackendManager()
  
  // Start backend (in development, assumes it's running externally)
  if (app.isPackaged) {
    await backendManager.start()
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  // Stop backend when app closes
  if (backendManager) {
    await backendManager.stop()
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

// Dialog handlers
ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    ...options
  })
  return result
})

ipcMain.handle('dialog:openDirectory', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    ...options
  })
  return result
})

ipcMain.handle('dialog:saveFile', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options)
  return result
})

// Shell handlers
ipcMain.handle('shell:openPath', async (_, filePath: string) => {
  return shell.openPath(filePath)
})

ipcMain.handle('shell:openExternal', async (_, url: string) => {
  return shell.openExternal(url)
})

// App info
ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

ipcMain.handle('app:getPath', (_, name: string) => {
  return app.getPath(name as any)
})

// Backend status
ipcMain.handle('backend:getStatus', () => {
  return backendManager?.getStatus() ?? { running: false, url: null }
})

ipcMain.handle('backend:getUrl', () => {
  return backendManager?.getUrl() ?? 'http://localhost:8000'
})

// Database handlers - these will be expanded as needed
ipcMain.handle('db:query', async (_, { sql, params }) => {
  const db = getDatabase()
  try {
    const stmt = db.prepare(sql)
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return params ? stmt.all(...params) : stmt.all()
    } else {
      return params ? stmt.run(...params) : stmt.run()
    }
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
})

ipcMain.handle('db:exec', async (_, sql: string) => {
  const db = getDatabase()
  try {
    return db.exec(sql)
  } catch (error) {
    console.error('Database exec error:', error)
    throw error
  }
})

// File system handlers
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } catch (error) {
    console.error('File read error:', error)
    throw error
  }
})

ipcMain.handle('fs:getFileStats', async (_, filePath: string) => {
  try {
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      mtime: stats.mtimeMs
    }
  } catch (error) {
    console.error('File stats error:', error)
    throw error
  }
})
