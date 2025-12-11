/**
 * Backend Configuration
 * 
 * Single source of truth for backend URL configuration.
 * All components should use this module instead of hardcoding URLs.
 */

// Default ports
export const BACKEND_PORT_BUNDLED = 8765
export const BACKEND_PORT_DEV = 8000

// Default URLs
export const BACKEND_URL_BUNDLED = `http://127.0.0.1:${BACKEND_PORT_BUNDLED}`
export const BACKEND_URL_DEV = `http://localhost:${BACKEND_PORT_DEV}`

/**
 * Get the default backend URL based on environment
 */
export function getDefaultBackendUrl(): string {
  // In production (packaged app), use the bundled backend port
  // In development, use the dev server port
  return BACKEND_URL_BUNDLED
}

/**
 * Get the backend URL from Electron (if available) or fall back to default
 */
export async function getBackendUrl(): Promise<string> {
  try {
    if (window.electron) {
      const url = await window.electron.getBackendUrl()
      console.log('[Config] Backend URL from Electron:', url)
      return url
    }
  } catch (error) {
    console.warn('[Config] Could not get backend URL from Electron:', error)
  }
  
  const defaultUrl = getDefaultBackendUrl()
  console.log('[Config] Using default backend URL:', defaultUrl)
  return defaultUrl
}

/**
 * Validate a backend URL format
 */
export function isValidBackendUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
