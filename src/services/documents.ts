/**
 * Document Service
 * 
 * Handles document import, storage, and management operations.
 */

import { v4 as uuidv4 } from 'uuid'
import { api } from './api'

export interface DocumentRecord {
  id: string
  project_id: string
  filename: string
  file_path: string
  file_hash: string
  file_size: number | null
  content_type: string | null
  report_year: number | null
  company_name: string | null
  industry: string | null
  country: string | null
  report_type: string | null
  custom_tags: string | null
  custom_metadata: string | null
  extracted_text: string | null
  extracted_pages: string | null
  pdf_metadata: string | null
  inferred_metadata: string | null
  analysis_status: string
  analyzed_at: string | null
  created_at: string
}

export interface ImportProgress {
  total: number
  current: number
  currentFile: string
  status: 'pending' | 'importing' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface ImportResult {
  success: boolean
  documentId?: string
  filename: string
  error?: string
}

/**
 * Calculate a simple hash of file contents for deduplication
 */
async function calculateFileHash(filePath: string): Promise<string> {
  // We'll use the file path + size + modification time as a simple hash
  // In a production app, you might want to use actual content hashing
  const stats = await window.electron.dbQuery<{ path: string }>(
    'SELECT ? as path',
    [filePath]
  )
  
  // For now, use a combination of path and timestamp
  const encoder = new TextEncoder()
  const data = encoder.encode(filePath + Date.now())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract year from filename or content
 */
function extractYearFromFilename(filename: string): number | null {
  // Look for 4-digit year patterns (1990-2099)
  const yearMatch = filename.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) {
    return parseInt(yearMatch[0], 10)
  }
  return null
}

/**
 * Extract company name from filename
 */
function extractCompanyFromFilename(filename: string): string | null {
  // Remove common suffixes and year patterns
  let name = filename
    .replace(/\.(pdf|PDF)$/, '')
    .replace(/\b(19|20)\d{2}\b/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+(annual|report|sustainability|csr|esg)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return name.length > 0 ? name : null
}

/**
 * Import a single document
 */
export async function importDocument(
  projectId: string,
  filePath: string,
  onProgress?: (status: string) => void
): Promise<ImportResult> {
  const filename = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown.pdf'
  
  try {
    onProgress?.('Calculating file hash...')
    const fileHash = await calculateFileHash(filePath)
    
    // Check for duplicates in this project
    const existing = await window.electron.dbQuery<{ id: string }>(
      'SELECT id FROM documents WHERE project_id = ? AND file_hash = ?',
      [projectId, fileHash]
    )
    
    if (existing.length > 0) {
      return {
        success: false,
        filename,
        error: 'Document already exists in this project'
      }
    }
    
    // Read file and send to API for processing
    onProgress?.('Processing PDF...')
    
    // Create a File object from the path
    // Note: In Electron, we need to read the file through IPC
    const fileBuffer = await window.electron.readFile(filePath)
    
    // Detect content type from filename extension
    const ext = filename.toLowerCase().split('.').pop()
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json'
    }
    const contentType = contentTypes[ext || ''] || 'application/octet-stream'
    
    // Convert ArrayBuffer to Uint8Array for proper File construction
    // (ArrayBuffer from IPC may need this conversion)
    const uint8Array = new Uint8Array(fileBuffer)
    console.log('[Documents] ArrayBuffer received, byte length:', fileBuffer.byteLength)
    console.log('[Documents] Uint8Array created, length:', uint8Array.length)
    
    // Create a Blob first, then convert to File (more reliable across environments)
    const blob = new Blob([uint8Array], { type: contentType })
    const file = new File([blob], filename, { type: contentType })
    console.log('[Documents] Created file:', filename, 'size:', file.size, 'type:', file.type)
    
    // Process through API
    const apiResult = await api.processFile(file, { include_extracted_text: true })
    
    // Extract metadata from filename and API response
    const reportYear = apiResult.inferred?.probable_year || extractYearFromFilename(filename)
    const companyName = apiResult.inferred?.probable_company || extractCompanyFromFilename(filename)
    
    // Generate document ID
    const documentId = uuidv4()
    
    // Insert into database
    onProgress?.('Saving to database...')
    await window.electron.dbRun(
      `INSERT INTO documents (
        id, project_id, filename, file_path, file_hash, file_size, content_type,
        report_year, company_name, report_type,
        extracted_text, extracted_pages, pdf_metadata, inferred_metadata,
        analysis_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId,
        projectId,
        filename,
        filePath,
        fileHash,
        apiResult.size || null,
        apiResult.content_type || 'application/pdf',
        reportYear,
        companyName,
        apiResult.inferred?.document_type || null,
        apiResult.extracted_text?.full_text || null,
        apiResult.extracted_text?.pages ? JSON.stringify(apiResult.extracted_text.pages) : null,
        apiResult.metadata ? JSON.stringify(apiResult.metadata) : null,
        apiResult.inferred ? JSON.stringify(apiResult.inferred) : null,
        'pending'
      ]
    )
    
    // Update project's updated_at timestamp
    await window.electron.dbRun(
      'UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [projectId]
    )
    
    return {
      success: true,
      documentId,
      filename
    }
  } catch (error) {
    console.error('Import error:', error)
    return {
      success: false,
      filename,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Import multiple documents with progress tracking
 */
export async function importDocuments(
  projectId: string,
  filePaths: string[],
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i]
    const filename = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown.pdf'
    
    onProgress?.({
      total: filePaths.length,
      current: i + 1,
      currentFile: filename,
      status: 'importing'
    })
    
    const result = await importDocument(projectId, filePath, (status) => {
      onProgress?.({
        total: filePaths.length,
        current: i + 1,
        currentFile: filename,
        status: 'processing'
      })
    })
    
    results.push(result)
  }
  
  onProgress?.({
    total: filePaths.length,
    current: filePaths.length,
    currentFile: '',
    status: 'completed'
  })
  
  return results
}

/**
 * Update document metadata
 */
export async function updateDocumentMetadata(
  documentId: string,
  metadata: Partial<Pick<DocumentRecord, 
    'report_year' | 'company_name' | 'industry' | 'country' | 'report_type' | 'custom_tags'
  >>
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []
  
  if (metadata.report_year !== undefined) {
    updates.push('report_year = ?')
    values.push(metadata.report_year)
  }
  if (metadata.company_name !== undefined) {
    updates.push('company_name = ?')
    values.push(metadata.company_name)
  }
  if (metadata.industry !== undefined) {
    updates.push('industry = ?')
    values.push(metadata.industry)
  }
  if (metadata.country !== undefined) {
    updates.push('country = ?')
    values.push(metadata.country)
  }
  if (metadata.report_type !== undefined) {
    updates.push('report_type = ?')
    values.push(metadata.report_type)
  }
  if (metadata.custom_tags !== undefined) {
    updates.push('custom_tags = ?')
    values.push(metadata.custom_tags)
  }
  
  if (updates.length === 0) return
  
  values.push(documentId)
  
  await window.electron.dbRun(
    `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
    values
  )
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await window.electron.dbRun('DELETE FROM documents WHERE id = ?', [documentId])
}

/**
 * Delete multiple documents
 */
export async function deleteDocuments(documentIds: string[]): Promise<void> {
  const placeholders = documentIds.map(() => '?').join(', ')
  await window.electron.dbRun(
    `DELETE FROM documents WHERE id IN (${placeholders})`,
    documentIds
  )
}

/**
 * Get all documents for a project
 */
export async function getProjectDocuments(projectId: string): Promise<DocumentRecord[]> {
  return window.electron.dbQuery<DocumentRecord>(
    'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  )
}

/**
 * Get a single document
 */
export async function getDocument(documentId: string): Promise<DocumentRecord | null> {
  const results = await window.electron.dbQuery<DocumentRecord>(
    'SELECT * FROM documents WHERE id = ?',
    [documentId]
  )
  return results[0] || null
}
