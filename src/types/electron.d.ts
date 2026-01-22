// Type definitions for the Electron API exposed via preload

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

export interface ElectronAPI {
  // Dialog
  openFileDialog: (options?: DialogOptions) => Promise<OpenDialogResult>
  openDirectoryDialog: (options?: DialogOptions) => Promise<OpenDialogResult>
  saveFileDialog: (options?: DialogOptions) => Promise<SaveDialogResult>

  // Shell
  openPath: (filePath: string) => Promise<string>
  openExternal: (url: string) => Promise<void>

  // App
  getVersion: () => Promise<string>
  getPath: (name: string) => Promise<string>

  // Backend
  getBackendStatus: () => Promise<BackendStatus>
  getBackendUrl: () => Promise<string>

  // Database
  dbQuery: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>
  dbRun: (sql: string, params?: unknown[]) => Promise<DatabaseResult>
  dbExec: (sql: string) => Promise<void>

  // File system
  readFile: (filePath: string) => Promise<ArrayBuffer>
  getFileStats: (filePath: string) => Promise<{ size: number; mtime: number }>
  computeFileHash: (filePath: string) => Promise<string>
  writeFile: (filePath: string, data: ArrayBuffer | string) => Promise<{ success: boolean }>

  // Event listeners
  onUpdateAvailable: (callback: () => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export {}
