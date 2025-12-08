import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// specific Electron APIs without exposing the entire Electron API

export interface DialogOptions {
  title?: string
  defaultPath?: string
  buttonLabel?: string
  filters?: { name: string; extensions: string[] }[]
}

export interface OpenDialogResult {
  canceled: boolean
  filePaths: string[]
}

export interface SaveDialogResult {
  canceled: boolean
  filePath?: string
}

export interface BackendStatus {
  running: boolean
  url: string | null
  pid?: number
}

export interface DatabaseResult {
  changes?: number
  lastInsertRowid?: number | bigint
}

// API exposed to renderer
const electronAPI = {
  // Dialog
  openFileDialog: (options?: DialogOptions): Promise<OpenDialogResult> =>
    ipcRenderer.invoke('dialog:openFile', options),
  openDirectoryDialog: (options?: DialogOptions): Promise<OpenDialogResult> =>
    ipcRenderer.invoke('dialog:openDirectory', options),
  saveFileDialog: (options?: DialogOptions): Promise<SaveDialogResult> =>
    ipcRenderer.invoke('dialog:saveFile', options),

  // Shell
  openPath: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('shell:openPath', filePath),
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('shell:openExternal', url),

  // App
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string): Promise<string> =>
    ipcRenderer.invoke('app:getPath', name),

  // Backend
  getBackendStatus: (): Promise<BackendStatus> =>
    ipcRenderer.invoke('backend:getStatus'),
  getBackendUrl: (): Promise<string> =>
    ipcRenderer.invoke('backend:getUrl'),

  // Database
  dbQuery: <T = unknown>(sql: string, params?: unknown[]): Promise<T[]> =>
    ipcRenderer.invoke('db:query', { sql, params }),
  dbRun: (sql: string, params?: unknown[]): Promise<DatabaseResult> =>
    ipcRenderer.invoke('db:query', { sql, params }),
  dbExec: (sql: string): Promise<void> =>
    ipcRenderer.invoke('db:exec', sql),

  // File system
  readFile: (filePath: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('fs:readFile', filePath),
  getFileStats: (filePath: string): Promise<{ size: number; mtime: number }> =>
    ipcRenderer.invoke('fs:getFileStats', filePath),

  // Event listeners for updates
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback)
    return () => ipcRenderer.removeListener('update-available', callback)
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback)
    return () => ipcRenderer.removeListener('update-downloaded', callback)
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI)

// Type definitions for the renderer
export type ElectronAPI = typeof electronAPI
