/**
 * Collections Service
 *
 * Manages virtual document collections (groupings) within projects.
 * Collections allow researchers to organize documents into meaningful subsets
 * for batch analysis and comparison.
 */

import { v4 as uuidv4 } from 'uuid'
import type { DocumentRecord } from './documents'

export interface Collection {
  id: string
  project_id: string
  name: string
  description: string | null
  filter_criteria: string | null
  created_at: string
  updated_at: string
}

export interface CollectionWithDocuments extends Collection {
  documents: DocumentRecord[]
  document_count: number
}

/**
 * Create a new collection
 */
export async function createCollection(
  projectId: string,
  name: string,
  description: string | null = null,
  documentIds: string[] = [],
  filterCriteria?: Record<string, unknown>
): Promise<string> {
  const collectionId = uuidv4()

  try {
    // Insert collection record
    await window.electron.dbRun(
      `INSERT INTO collections (id, project_id, name, description, filter_criteria)
       VALUES (?, ?, ?, ?, ?)`,
      [
        collectionId,
        projectId,
        name,
        description,
        filterCriteria ? JSON.stringify(filterCriteria) : null
      ]
    )

    // Add documents to collection if provided
    if (documentIds.length > 0) {
      await addDocumentsToCollection(collectionId, documentIds)
    }

    return collectionId
  } catch (error) {
    console.error('Error creating collection:', error)
    throw error
  }
}

/**
 * Get all collections for a project
 */
export async function getProjectCollections(
  projectId: string
): Promise<Collection[]> {
  try {
    return await window.electron.dbQuery<Collection>(
      'SELECT * FROM collections WHERE project_id = ? ORDER BY updated_at DESC',
      [projectId]
    )
  } catch (error) {
    console.error('Error getting project collections:', error)
    throw error
  }
}

/**
 * Get a single collection with its documents
 */
export async function getCollectionWithDocuments(
  collectionId: string
): Promise<CollectionWithDocuments | null> {
  try {
    // Get collection metadata
    const collections = await window.electron.dbQuery<Collection>(
      'SELECT * FROM collections WHERE id = ?',
      [collectionId]
    )

    if (collections.length === 0) {
      return null
    }

    const collection = collections[0]

    // Get documents in collection
    const documents = await window.electron.dbQuery<DocumentRecord>(
      `SELECT d.* FROM documents d
       INNER JOIN collection_documents cd ON d.id = cd.document_id
       WHERE cd.collection_id = ?
       ORDER BY d.created_at DESC`,
      [collectionId]
    )

    return {
      ...collection,
      documents,
      document_count: documents.length
    }
  } catch (error) {
    console.error('Error getting collection with documents:', error)
    throw error
  }
}

/**
 * Add documents to a collection
 */
export async function addDocumentsToCollection(
  collectionId: string,
  documentIds: string[]
): Promise<void> {
  if (documentIds.length === 0) return

  try {
    for (const documentId of documentIds) {
      // Use INSERT OR IGNORE to handle duplicates gracefully
      await window.electron.dbRun(
        `INSERT OR IGNORE INTO collection_documents (collection_id, document_id)
         VALUES (?, ?)`,
        [collectionId, documentId]
      )
    }

    // Update collection's updated_at timestamp
    await window.electron.dbRun(
      'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [collectionId]
    )
  } catch (error) {
    console.error('Error adding documents to collection:', error)
    throw error
  }
}

/**
 * Remove documents from a collection
 */
export async function removeDocumentsFromCollection(
  collectionId: string,
  documentIds: string[]
): Promise<void> {
  if (documentIds.length === 0) return

  try {
    const placeholders = documentIds.map(() => '?').join(', ')
    await window.electron.dbRun(
      `DELETE FROM collection_documents
       WHERE collection_id = ? AND document_id IN (${placeholders})`,
      [collectionId, ...documentIds]
    )

    // Update collection's updated_at timestamp
    await window.electron.dbRun(
      'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [collectionId]
    )
  } catch (error) {
    console.error('Error removing documents from collection:', error)
    throw error
  }
}

/**
 * Update collection metadata
 */
export async function updateCollection(
  collectionId: string,
  updates: Partial<Pick<Collection, 'name' | 'description'>>
): Promise<void> {
  try {
    const updateFields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      updateFields.push('name = ?')
      values.push(updates.name)
    }

    if (updates.description !== undefined) {
      updateFields.push('description = ?')
      values.push(updates.description)
    }

    if (updateFields.length === 0) return

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(collectionId)

    await window.electron.dbRun(
      `UPDATE collections SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    )
  } catch (error) {
    console.error('Error updating collection:', error)
    throw error
  }
}

/**
 * Delete a collection (documents remain in project)
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    await window.electron.dbRun(
      'DELETE FROM collections WHERE id = ?',
      [collectionId]
    )
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

/**
 * Get extracted text for all documents in a collection
 * Used for batch analysis requests to backend
 */
export async function getCollectionTexts(
  collectionId: string
): Promise<Array<{ documentId: string; text: string; documentName: string }>> {
  try {
    const documents = await window.electron.dbQuery<{
      id: string
      filename: string
      extracted_text: string | null
    }>(
      `SELECT d.id, d.filename, d.extracted_text FROM documents d
       INNER JOIN collection_documents cd ON d.id = cd.document_id
       WHERE cd.collection_id = ? AND d.extracted_text IS NOT NULL
       ORDER BY d.created_at DESC`,
      [collectionId]
    )

    return documents.map(doc => ({
      documentId: doc.id,
      documentName: doc.filename,
      text: doc.extracted_text || ''
    }))
  } catch (error) {
    console.error('Error getting collection texts:', error)
    throw error
  }
}

/**
 * Get document count for a collection
 */
export async function getCollectionDocumentCount(
  collectionId: string
): Promise<number> {
  try {
    const result = await window.electron.dbQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM collection_documents WHERE collection_id = ?',
      [collectionId]
    )
    return result[0]?.count || 0
  } catch (error) {
    console.error('Error getting collection document count:', error)
    throw error
  }
}

/**
 * Check if a document is in a collection
 */
export async function isDocumentInCollection(
  collectionId: string,
  documentId: string
): Promise<boolean> {
  try {
    const result = await window.electron.dbQuery<{ exists: number }>(
      'SELECT COUNT(*) as exists FROM collection_documents WHERE collection_id = ? AND document_id = ?',
      [collectionId, documentId]
    )
    return (result[0]?.exists || 0) > 0
  } catch (error) {
    console.error('Error checking document in collection:', error)
    throw error
  }
}

/**
 * Duplicate a collection with all its documents
 */
export async function duplicateCollection(
  collectionId: string,
  newName: string
): Promise<string> {
  try {
    // Get original collection
    const collection = await window.electron.dbQuery<Collection>(
      'SELECT * FROM collections WHERE id = ?',
      [collectionId]
    )

    if (collection.length === 0) {
      throw new Error('Collection not found')
    }

    // Get documents in collection
    const documentIds = await window.electron.dbQuery<{ document_id: string }>(
      'SELECT document_id FROM collection_documents WHERE collection_id = ?',
      [collectionId]
    )

    // Create new collection with same settings
    const newCollectionId = await createCollection(
      collection[0].project_id,
      newName,
      collection[0].description,
      documentIds.map(d => d.document_id)
    )

    return newCollectionId
  } catch (error) {
    console.error('Error duplicating collection:', error)
    throw error
  }
}
