/**
 * Import Service
 *
 * Handles importing .lens bundle files with intelligent deduplication
 * based on content-based SHA-256 file hashing.
 */

import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'
import type { DocumentRecord } from './documents'
import type { Collection } from './collections'
import type { AnalysisProfile, ProfileConfig } from './profiles'

// ============================================================================
// Types
// ============================================================================

export interface BundleManifest {
  version: string
  format: 'lens-bundle'
  created_at: string
  source: {
    project_id: string
    project_name: string
    app_version: string
  }
  contents: {
    documents: number
    collections: number
    profiles: number
    includes_text: boolean
    includes_analysis: boolean
    includes_pdfs: boolean
  }
}

export interface BundleDocumentData {
  id: string
  filename: string
  file_path: string
  file_size: number | null
  file_hash: string
  content_type: string | null
  company_name: string | null
  report_year: number | null
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
  analysis_results: Record<string, unknown> | null
  created_at: string
  analyzed_at: string | null
}

export interface BundleCollectionData {
  id: string
  name: string
  description: string | null
  filter_criteria: string | null
  document_ids: string[]
  created_at: string
}

export interface BundleProfileData {
  id: string
  name: string
  description: string | null
  config: ProfileConfig
  is_active: boolean
  created_at: string
}

export interface ImportProgress {
  phase: 'reading' | 'analyzing' | 'importing' | 'complete'
  current: number
  total: number
  currentItem: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface ImportPreview {
  manifest: BundleManifest
  documents: {
    total: number
    newDocuments: number
    duplicates: number
    items: Array<{
      id: string
      filename: string
      file_hash: string
      status: 'new' | 'duplicate' | 'pdf_missing'
      existingDocumentId?: string
    }>
  }
  collections: BundleCollectionData[]
  profiles: BundleProfileData[]
  estimatedSize: number
}

export interface ImportResult {
  success: boolean
  documentsImported: number
  documentsSkipped: number
  collectionsImported: number
  profilesImported: number
  errors: string[]
  bundleImportId: string
}

// ============================================================================
// Bundle Reading
// ============================================================================

/**
 * Extract and validate a .lens bundle file
 */
export async function readBundleFile(bundlePath: string): Promise<{
  zip: JSZip
  manifest: BundleManifest
}> {
  // Read file as ArrayBuffer
  const fileBuffer = await window.electron.readFile(bundlePath)

  // Load ZIP
  const zip = await JSZip.loadAsync(fileBuffer)

  // Read and validate manifest
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('Invalid bundle: missing manifest.json')
  }

  const manifestText = await manifestFile.async('text')
  const manifest = JSON.parse(manifestText) as BundleManifest

  // Validate manifest
  if (manifest.format !== 'lens-bundle') {
    throw new Error('Invalid bundle format')
  }

  if (!manifest.version || !manifest.source || !manifest.contents) {
    throw new Error('Invalid manifest structure')
  }

  return { zip, manifest }
}

/**
 * Get preview of bundle contents before importing
 */
export async function previewBundle(
  bundlePath: string,
  targetProjectId: string
): Promise<ImportPreview> {
  const { zip, manifest } = await readBundleFile(bundlePath)

  // Read documents folder
  const documentsFolder = zip.folder('documents')
  const documents: Array<{
    id: string
    filename: string
    file_hash: string
    status: 'new' | 'duplicate' | 'pdf_missing'
    existingDocumentId?: string
  }> = []

  let newCount = 0
  let duplicateCount = 0

  if (documentsFolder) {
    const docFiles = documentsFolder.filter((_, file) => file.name.endsWith('.json'))

    for (const docFile of docFiles) {
      const docText = await docFile.async('text')
      const docData = JSON.parse(docText) as BundleDocumentData

      // Check if document already exists by file hash
      const existing = await findDocumentByHash(targetProjectId, docData.file_hash)

      if (existing) {
        duplicateCount++
        documents.push({
          id: docData.id,
          filename: docData.filename,
          file_hash: docData.file_hash,
          status: 'duplicate',
          existingDocumentId: existing.id
        })
      } else {
        newCount++
        documents.push({
          id: docData.id,
          filename: docData.filename,
          file_hash: docData.file_hash,
          status: 'new'
        })
      }
    }
  }

  // Read collections
  const collections: BundleCollectionData[] = []
  const collectionsFolder = zip.folder('collections')
  if (collectionsFolder) {
    const collectionFiles = collectionsFolder.filter((_, file) => file.name.endsWith('.json'))
    for (const collFile of collectionFiles) {
      const collText = await collFile.async('text')
      collections.push(JSON.parse(collText))
    }
  }

  // Read profiles
  const profiles: BundleProfileData[] = []
  const profilesFolder = zip.folder('profiles')
  if (profilesFolder) {
    const profileFiles = profilesFolder.filter((_, file) => file.name.endsWith('.json'))
    for (const profFile of profileFiles) {
      const profText = await profFile.async('text')
      profiles.push(JSON.parse(profText))
    }
  }

  // Estimate bundle size from file
  const stats = await window.electron.getFileStats(bundlePath)

  return {
    manifest,
    documents: {
      total: documents.length,
      newDocuments: newCount,
      duplicates: duplicateCount,
      items: documents
    },
    collections,
    profiles,
    estimatedSize: stats.size
  }
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import a .lens bundle into a project
 */
export async function importBundle(
  bundlePath: string,
  targetProjectId: string,
  options: {
    importDocuments: boolean
    importCollections: boolean
    importProfiles: boolean
    skipDuplicates: boolean
  },
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const errors: string[] = []
  let documentsImported = 0
  let documentsSkipped = 0
  let collectionsImported = 0
  let profilesImported = 0

  // Create bundle import record
  const bundleImportId = uuidv4()

  try {
    // Read bundle
    onProgress?.({
      phase: 'reading',
      current: 0,
      total: 1,
      currentItem: 'Reading bundle file...',
      status: 'processing'
    })

    const { zip, manifest } = await readBundleFile(bundlePath)

    // Map old document IDs to new ones (for collection references)
    const documentIdMap = new Map<string, string>()

    // Import documents
    if (options.importDocuments) {
      const documentsFolder = zip.folder('documents')
      if (documentsFolder) {
        const docFiles = documentsFolder.filter((_, file) => file.name.endsWith('.json'))
        const totalDocs = docFiles.length
        let currentDoc = 0

        for (const docFile of docFiles) {
          currentDoc++

          try {
            const docText = await docFile.async('text')
            const docData = JSON.parse(docText) as BundleDocumentData

            onProgress?.({
              phase: 'importing',
              current: currentDoc,
              total: totalDocs,
              currentItem: `Importing: ${docData.filename}`,
              status: 'processing'
            })

            // Check for duplicates
            if (options.skipDuplicates) {
              const existing = await findDocumentByHash(targetProjectId, docData.file_hash)
              if (existing) {
                documentIdMap.set(docData.id, existing.id)
                documentsSkipped++
                continue
              }
            }

            // Import document
            const newDocId = await importDocument(targetProjectId, docData)
            documentIdMap.set(docData.id, newDocId)
            documentsImported++

          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`Document import failed: ${message}`)
          }
        }
      }
    }

    // Import collections
    if (options.importCollections) {
      const collectionsFolder = zip.folder('collections')
      if (collectionsFolder) {
        const collectionFiles = collectionsFolder.filter((_, file) => file.name.endsWith('.json'))

        for (const collFile of collectionFiles) {
          try {
            const collText = await collFile.async('text')
            const collData = JSON.parse(collText) as BundleCollectionData

            // Map old document IDs to new ones
            const mappedDocIds = collData.document_ids
              .map(oldId => documentIdMap.get(oldId))
              .filter((id): id is string => id !== undefined)

            // Create collection with mapped document IDs
            await importCollection(targetProjectId, collData, mappedDocIds)
            collectionsImported++

          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`Collection import failed: ${message}`)
          }
        }
      }
    }

    // Import profiles
    if (options.importProfiles) {
      const profilesFolder = zip.folder('profiles')
      if (profilesFolder) {
        const profileFiles = profilesFolder.filter((_, file) => file.name.endsWith('.json'))

        for (const profFile of profileFiles) {
          try {
            const profText = await profFile.async('text')
            const profData = JSON.parse(profText) as BundleProfileData

            await importProfile(targetProjectId, profData)
            profilesImported++

          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            errors.push(`Profile import failed: ${message}`)
          }
        }
      }
    }

    // Record bundle import
    await window.electron.dbRun(
      `INSERT INTO bundle_imports
       (id, project_id, source_bundle_path, source_project_id, source_project_name,
        imported_document_count, skipped_duplicate_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        bundleImportId,
        targetProjectId,
        bundlePath,
        manifest.source.project_id,
        manifest.source.project_name,
        documentsImported,
        documentsSkipped
      ]
    )

    onProgress?.({
      phase: 'complete',
      current: documentsImported + collectionsImported + profilesImported,
      total: documentsImported + collectionsImported + profilesImported,
      currentItem: 'Import complete',
      status: 'completed'
    })

    return {
      success: errors.length === 0,
      documentsImported,
      documentsSkipped,
      collectionsImported,
      profilesImported,
      errors,
      bundleImportId
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Bundle import failed: ${message}`)

    onProgress?.({
      phase: 'complete',
      current: 0,
      total: 1,
      currentItem: 'Import failed',
      status: 'failed',
      error: message
    })

    return {
      success: false,
      documentsImported,
      documentsSkipped,
      collectionsImported,
      profilesImported,
      errors,
      bundleImportId
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find an existing document by file hash
 */
async function findDocumentByHash(
  projectId: string,
  fileHash: string
): Promise<{ id: string } | null> {
  const results = await window.electron.dbQuery<{ id: string }>(
    'SELECT id FROM documents WHERE project_id = ? AND file_hash = ?',
    [projectId, fileHash]
  )
  return results.length > 0 ? results[0] : null
}

/**
 * Import a single document from bundle data
 */
async function importDocument(
  projectId: string,
  docData: BundleDocumentData
): Promise<string> {
  const newId = uuidv4()

  await window.electron.dbRun(
    `INSERT INTO documents
     (id, project_id, filename, file_path, file_hash, file_size, content_type,
      company_name, report_year, industry, country, report_type,
      custom_tags, custom_metadata, extracted_text, extracted_pages,
      pdf_metadata, inferred_metadata, analysis_status, analyzed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      projectId,
      docData.filename,
      docData.file_path,  // Original path for reference
      docData.file_hash,
      docData.file_size,
      docData.content_type,
      docData.company_name,
      docData.report_year,
      docData.industry,
      docData.country,
      docData.report_type,
      docData.custom_tags,
      docData.custom_metadata,
      docData.extracted_text,
      docData.extracted_pages,
      docData.pdf_metadata,
      docData.inferred_metadata,
      docData.analysis_status,
      docData.analyzed_at
    ]
  )

  // Import analysis results if included
  if (docData.analysis_results) {
    for (const [analysisType, results] of Object.entries(docData.analysis_results)) {
      const analysisId = uuidv4()
      await window.electron.dbRun(
        `INSERT INTO analysis_results (id, document_id, analysis_type, results)
         VALUES (?, ?, ?, ?)`,
        [analysisId, newId, analysisType, JSON.stringify(results)]
      )
    }
  }

  return newId
}

/**
 * Import a collection with mapped document IDs
 */
async function importCollection(
  projectId: string,
  collData: BundleCollectionData,
  mappedDocIds: string[]
): Promise<string> {
  const newId = uuidv4()

  // Insert collection
  await window.electron.dbRun(
    `INSERT INTO collections (id, project_id, name, description, filter_criteria)
     VALUES (?, ?, ?, ?, ?)`,
    [
      newId,
      projectId,
      collData.name,
      collData.description,
      collData.filter_criteria
    ]
  )

  // Add documents to collection
  for (const docId of mappedDocIds) {
    await window.electron.dbRun(
      `INSERT OR IGNORE INTO collection_documents (collection_id, document_id)
       VALUES (?, ?)`,
      [newId, docId]
    )
  }

  return newId
}

/**
 * Import a profile (without setting as active)
 */
async function importProfile(
  projectId: string,
  profData: BundleProfileData
): Promise<string> {
  const newId = uuidv4()

  await window.electron.dbRun(
    `INSERT INTO analysis_profiles (id, project_id, name, description, config, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newId,
      projectId,
      profData.name,
      profData.description,
      JSON.stringify(profData.config),
      false  // Never set as active on import
    ]
  )

  return newId
}

/**
 * Get bundle import history for a project
 */
export async function getBundleImports(projectId: string): Promise<Array<{
  id: string
  source_bundle_path: string
  source_project_id: string
  source_project_name: string
  imported_document_count: number
  skipped_duplicate_count: number
  imported_at: string
}>> {
  return window.electron.dbQuery(
    `SELECT * FROM bundle_imports WHERE project_id = ? ORDER BY imported_at DESC`,
    [projectId]
  )
}
