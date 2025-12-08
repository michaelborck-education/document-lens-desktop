/**
 * Keyword Service
 * 
 * Manages keyword lists including built-in frameworks and custom lists.
 */

import { v4 as uuidv4 } from 'uuid'

// Import framework data
import tcfdData from '@/data/frameworks/tcfd.json'
import sdgsData from '@/data/frameworks/sdgs.json'
import griData from '@/data/frameworks/gri.json'
import sasbData from '@/data/frameworks/sasb.json'

export interface FrameworkData {
  name: string
  framework: string
  version: string
  description: string
  source: string
  list_type: 'simple' | 'grouped' | 'weighted'
  total_keywords: number
  keywords: Record<string, string[]> | string[] | Array<{ term: string; weight: number }>
}

export interface KeywordList {
  id: string
  name: string
  description: string | null
  framework: string | null
  list_type: string
  keywords: string // JSON string
  is_builtin: boolean
  created_at: string
  updated_at: string
}

export interface ParsedKeywordList extends Omit<KeywordList, 'keywords'> {
  keywords: Record<string, string[]> | string[]
  totalCount: number
}

// Framework data map
const FRAMEWORKS: Record<string, FrameworkData> = {
  tcfd: tcfdData as FrameworkData,
  sdgs: sdgsData as FrameworkData,
  gri: griData as FrameworkData,
  sasb: sasbData as FrameworkData,
}

/**
 * Seed built-in framework keyword lists into the database
 * Note: Primary seeding now happens in the main process (electron/database.ts)
 * This function serves as a verification/fallback for the renderer
 */
export async function seedFrameworkKeywords(): Promise<void> {
  try {
    // Check if already seeded (should be done by main process)
    const existing = await window.electron.dbQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM keyword_lists WHERE is_builtin = 1'
    )
    
    if (existing && existing[0] && existing[0].count > 0) {
      console.log(`Framework keywords verified: ${existing[0].count} found in database`)
      return
    }

    // Fallback: seed from renderer if main process didn't seed
    console.warn('Framework keywords not found in database, attempting fallback seeding...')
    
    for (const [key, data] of Object.entries(FRAMEWORKS)) {
      try {
        const id = uuidv4()
        await window.electron.dbRun(
          `INSERT INTO keyword_lists (id, name, description, framework, list_type, keywords, is_builtin)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [id, data.name, data.description, key, data.list_type, JSON.stringify(data.keywords)]
        )
        console.log(`Fallback seeded: ${data.name}`)
      } catch (insertError) {
        console.error(`Failed to insert framework ${key}:`, insertError)
      }
    }
    
    // Verify
    const verifyCount = await window.electron.dbQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM keyword_lists WHERE is_builtin = 1'
    )
    console.log(`Fallback seeding complete: ${verifyCount[0]?.count || 0} framework keyword lists`)
    
  } catch (error) {
    console.error('Failed to verify/seed framework keywords:', error)
  }
}

/**
 * Get all keyword lists
 */
export async function getAllKeywordLists(): Promise<KeywordList[]> {
  return window.electron.dbQuery<KeywordList>(
    'SELECT * FROM keyword_lists ORDER BY is_builtin DESC, name ASC'
  )
}

/**
 * Get keyword list by ID
 */
export async function getKeywordList(id: string): Promise<KeywordList | null> {
  const results = await window.electron.dbQuery<KeywordList>(
    'SELECT * FROM keyword_lists WHERE id = ?',
    [id]
  )
  return results[0] || null
}

/**
 * Get built-in framework lists
 */
export async function getBuiltinLists(): Promise<KeywordList[]> {
  return window.electron.dbQuery<KeywordList>(
    'SELECT * FROM keyword_lists WHERE is_builtin = 1 ORDER BY name'
  )
}

/**
 * Get custom lists
 */
export async function getCustomLists(): Promise<KeywordList[]> {
  return window.electron.dbQuery<KeywordList>(
    'SELECT * FROM keyword_lists WHERE is_builtin = 0 ORDER BY name'
  )
}

/**
 * Parse keywords from JSON string
 */
export function parseKeywords(list: KeywordList): ParsedKeywordList {
  const keywords = JSON.parse(list.keywords)
  let totalCount = 0
  
  if (Array.isArray(keywords)) {
    totalCount = keywords.length
  } else if (typeof keywords === 'object') {
    totalCount = Object.values(keywords).flat().length
  }
  
  return {
    ...list,
    keywords,
    totalCount,
  }
}

/**
 * Get all keywords as a flat array
 */
export function flattenKeywords(keywords: Record<string, string[]> | string[]): string[] {
  if (Array.isArray(keywords)) {
    return keywords
  }
  return Object.values(keywords).flat()
}

/**
 * Get keywords grouped by category
 */
export function getKeywordsByCategory(keywords: Record<string, string[]> | string[]): Record<string, string[]> {
  if (Array.isArray(keywords)) {
    return { 'All Keywords': keywords }
  }
  return keywords
}

/**
 * Create a new custom keyword list
 */
export async function createKeywordList(
  name: string,
  description: string | null,
  listType: 'simple' | 'grouped',
  keywords: Record<string, string[]> | string[]
): Promise<string> {
  const id = uuidv4()
  await window.electron.dbRun(
    `INSERT INTO keyword_lists (id, name, description, framework, list_type, keywords, is_builtin)
     VALUES (?, ?, ?, 'custom', ?, ?, 0)`,
    [id, name, description, listType, JSON.stringify(keywords)]
  )
  return id
}

/**
 * Update a custom keyword list
 */
export async function updateKeywordList(
  id: string,
  updates: {
    name?: string
    description?: string | null
    keywords?: Record<string, string[]> | string[]
  }
): Promise<void> {
  const setClauses: string[] = []
  const values: unknown[] = []

  if (updates.name !== undefined) {
    setClauses.push('name = ?')
    values.push(updates.name)
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?')
    values.push(updates.description)
  }
  if (updates.keywords !== undefined) {
    setClauses.push('keywords = ?')
    values.push(JSON.stringify(updates.keywords))
  }
  
  setClauses.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  await window.electron.dbRun(
    `UPDATE keyword_lists SET ${setClauses.join(', ')} WHERE id = ? AND is_builtin = 0`,
    values
  )
}

/**
 * Delete a custom keyword list
 */
export async function deleteKeywordList(id: string): Promise<void> {
  await window.electron.dbRun(
    'DELETE FROM keyword_lists WHERE id = ? AND is_builtin = 0',
    [id]
  )
}

/**
 * Duplicate a keyword list (creates a custom copy)
 */
export async function duplicateKeywordList(
  sourceId: string,
  newName: string
): Promise<string> {
  const source = await getKeywordList(sourceId)
  if (!source) {
    throw new Error('Source list not found')
  }

  const id = uuidv4()
  await window.electron.dbRun(
    `INSERT INTO keyword_lists (id, name, description, framework, list_type, keywords, is_builtin)
     VALUES (?, ?, ?, 'custom', ?, ?, 0)`,
    [
      id,
      newName,
      `Copy of ${source.name}`,
      source.list_type,
      source.keywords,
    ]
  )
  return id
}

/**
 * Import keywords from CSV
 * Expects format: keyword (one per line) or category,keyword
 */
export function parseKeywordsFromCSV(
  csvContent: string,
  hasCategories: boolean = false
): Record<string, string[]> | string[] {
  const lines = csvContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))

  if (!hasCategories) {
    return lines
  }

  const grouped: Record<string, string[]> = {}
  
  for (const line of lines) {
    const [category, keyword] = line.split(',').map(s => s.trim())
    if (category && keyword) {
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(keyword)
    }
  }

  return grouped
}

/**
 * Export keywords to CSV format
 */
export function exportKeywordsToCSV(
  keywords: Record<string, string[]> | string[],
  includeCategories: boolean = true
): string {
  if (Array.isArray(keywords)) {
    return keywords.join('\n')
  }

  if (!includeCategories) {
    return Object.values(keywords).flat().join('\n')
  }

  const lines: string[] = []
  for (const [category, terms] of Object.entries(keywords)) {
    for (const term of terms) {
      lines.push(`${category},${term}`)
    }
  }
  return lines.join('\n')
}

/**
 * Get framework metadata
 */
export function getFrameworkInfo(framework: string): FrameworkData | null {
  return FRAMEWORKS[framework] || null
}

/**
 * Get all available frameworks
 */
export function getAvailableFrameworks(): Array<{ id: string; name: string; description: string; keywordCount: number }> {
  return Object.entries(FRAMEWORKS).map(([id, data]) => ({
    id,
    name: data.name,
    description: data.description,
    keywordCount: data.total_keywords,
  }))
}
