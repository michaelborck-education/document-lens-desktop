/**
 * Export Service
 * 
 * Handles exporting data in various formats: CSV, Excel, JSON, and ZIP bundles.
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import type { DocumentRecord } from './documents'
import type { BatchKeywordSearchResult } from './analysis'
import type { NgramAnalysisResult } from './ngrams'

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'json'

export interface ProjectExportOptions {
  includeDocumentSummary: boolean
  includeDocumentText: boolean
  includeAnalysisResults: boolean
  includeKeywordResults: boolean
  includeNgramResults: boolean
  format: ExportFormat
}

export interface DocumentExportData {
  document: DocumentRecord
  analysis?: {
    readability?: Record<string, number>
    writingQuality?: Record<string, number>
    wordAnalysis?: {
      totalWords: number
      uniqueWords: number
      topWords: Array<{ word: string; count: number }>
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 100)
}

function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}

// ============================================================================
// CSV Export
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayToCsv<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const lines: string[] = [headers.join(',')]

  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h]
      if (val === null || val === undefined) return ''
      if (typeof val === 'string') {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }
      return String(val)
    })
    lines.push(values.join(','))
  }

  return lines.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadCsv<T extends Record<string, any>>(data: T[], filename: string): void {
  const csv = arrayToCsv(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

// ============================================================================
// Excel Export
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadExcel(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new()

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue
    const worksheet = XLSX.utils.json_to_sheet(sheet.data)
    
    // Auto-size columns
    const maxWidths: number[] = []
    const headers = Object.keys(sheet.data[0])
    headers.forEach((h, i) => {
      maxWidths[i] = Math.min(50, Math.max(
        h.length,
        ...sheet.data.map((row) => String(row[h] || '').length)
      ))
    })
    worksheet['!cols'] = maxWidths.map((w) => ({ wch: w }))
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.substring(0, 31))
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

// ============================================================================
// JSON Export
// ============================================================================

export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`)
}

// ============================================================================
// Document Export
// ============================================================================

export async function exportDocument(
  documentId: string,
  includeText: boolean = true
): Promise<DocumentExportData> {
  // Get document
  const docs = await window.electron.dbQuery<DocumentRecord>(
    'SELECT * FROM documents WHERE id = ?',
    [documentId]
  )
  
  if (docs.length === 0) {
    throw new Error('Document not found')
  }

  const document = docs[0]

  // Get analysis results
  const analysisRows = await window.electron.dbQuery<{
    analysis_type: string
    results: string
  }>(
    'SELECT analysis_type, results FROM analysis_results WHERE document_id = ?',
    [documentId]
  )

  const analysis: DocumentExportData['analysis'] = {}
  for (const row of analysisRows) {
    try {
      const parsed = JSON.parse(row.results)
      if (row.analysis_type === 'readability') {
        analysis.readability = parsed
      } else if (row.analysis_type === 'writing_quality') {
        analysis.writingQuality = parsed
      } else if (row.analysis_type === 'word_analysis') {
        analysis.wordAnalysis = parsed
      }
    } catch {
      // Skip invalid JSON
    }
  }

  // Optionally strip text to reduce file size
  const exportDoc = includeText
    ? document
    : { ...document, extracted_text: null, extracted_pages: null }

  return {
    document: exportDoc,
    analysis: Object.keys(analysis).length > 0 ? analysis : undefined,
  }
}

export async function downloadDocumentJson(
  documentId: string,
  includeText: boolean = true
): Promise<void> {
  const data = await exportDocument(documentId, includeText)
  const filename = sanitizeFilename(data.document.filename.replace('.pdf', ''))
  downloadJson(data, `${filename}-export.json`)
}

// ============================================================================
// Project Summary Export
// ============================================================================

export interface ProjectSummaryRow {
  filename: string
  company_name: string
  report_year: number | string
  industry: string
  country: string
  analysis_status: string
  word_count: number | string
  flesch_reading_ease: number | string
  flesch_kincaid_grade: number | string
  vocabulary_richness: number | string
  imported_at: string
  analyzed_at: string
}

export async function getProjectSummaryData(
  projectId: string
): Promise<ProjectSummaryRow[]> {
  const documents = await window.electron.dbQuery<DocumentRecord>(
    'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at',
    [projectId]
  )

  const summaryRows: ProjectSummaryRow[] = []

  for (const doc of documents) {
    // Get analysis results
    const analysisRows = await window.electron.dbQuery<{
      analysis_type: string
      results: string
    }>(
      'SELECT analysis_type, results FROM analysis_results WHERE document_id = ?',
      [doc.id]
    )

    let textMetrics: { word_count?: number } = {}
    let readability: Record<string, number> = {}
    let wordAnalysis: { vocabulary_richness?: number } = {}
    let writingQuality: { vocabulary_richness?: number } = {}

    for (const row of analysisRows) {
      try {
        const parsed = JSON.parse(row.results)
        if (row.analysis_type === 'text_metrics') textMetrics = parsed
        if (row.analysis_type === 'readability') readability = parsed
        if (row.analysis_type === 'word_analysis') wordAnalysis = parsed
        if (row.analysis_type === 'writing_quality') writingQuality = parsed
      } catch {
        // Skip
      }
    }

    summaryRows.push({
      filename: doc.filename,
      company_name: doc.company_name || '',
      report_year: doc.report_year || '',
      industry: doc.industry || '',
      country: doc.country || '',
      analysis_status: doc.analysis_status,
      word_count: textMetrics.word_count || '',
      flesch_reading_ease: (readability.flesch_score ?? readability.flesch_reading_ease)?.toFixed(1) || '',
      flesch_kincaid_grade: readability.flesch_kincaid_grade?.toFixed(1) || '',
      vocabulary_richness: wordAnalysis.vocabulary_richness
        ? (wordAnalysis.vocabulary_richness * 100).toFixed(1) + '%'
        : (writingQuality.vocabulary_richness
          ? (writingQuality.vocabulary_richness * 100).toFixed(1) + '%'
          : ''),
      imported_at: formatDate(doc.created_at),
      analyzed_at: doc.analyzed_at ? formatDate(doc.analyzed_at) : '',
    })
  }

  return summaryRows
}

export async function exportProjectSummary(
  projectId: string,
  projectName: string,
  format: 'csv' | 'xlsx'
): Promise<void> {
  const data = await getProjectSummaryData(projectId)
  const filename = sanitizeFilename(`${projectName}-summary-${formatDate(new Date())}`)

  if (format === 'csv') {
    downloadCsv(data, filename)
  } else {
    downloadExcel([{ name: 'Project Summary', data }], filename)
  }
}

// ============================================================================
// Keyword Results Export
// ============================================================================

export interface KeywordResultRow {
  document: string
  company: string
  year: number | string
  keyword: string
  count: number
  contexts: string
}

export function keywordResultsToRows(
  results: BatchKeywordSearchResult
): KeywordResultRow[] {
  const rows: KeywordResultRow[] = []

  for (const doc of results.documents) {
    for (const [keyword, match] of Object.entries(doc.matches)) {
      rows.push({
        document: doc.documentName,
        company: doc.companyName || '',
        year: doc.reportYear || '',
        keyword,
        count: match.count,
        contexts: match.contexts.slice(0, 3).map((c) => c.text).join(' | '),
      })
    }
  }

  return rows.sort((a, b) => b.count - a.count)
}

export function exportKeywordResults(
  results: BatchKeywordSearchResult,
  filename: string,
  format: 'csv' | 'xlsx'
): void {
  const rows = keywordResultsToRows(results)

  // Also create summary sheet for Excel
  const summaryRows = Object.entries(results.summary.keywordCounts)
    .map(([keyword, count]) => ({ keyword, total_count: count }))
    .sort((a, b) => b.total_count - a.total_count)

  if (format === 'csv') {
    downloadCsv(rows, filename)
  } else {
    downloadExcel(
      [
        { name: 'Keyword Results', data: rows },
        { name: 'Summary', data: summaryRows },
      ],
      filename
    )
  }
}

// ============================================================================
// N-gram Results Export
// ============================================================================

export interface NgramResultRow {
  phrase: string
  total_count: number
  document_count: number
  documents: string
}

export function ngramResultsToRows(results: NgramAnalysisResult): NgramResultRow[] {
  return results.aggregated.map((ngram) => ({
    phrase: ngram.phrase,
    total_count: ngram.totalCount,
    document_count: ngram.documentCount,
    documents: ngram.byDocument.map((d) => `${d.documentName} (${d.count})`).join('; '),
  }))
}

export function exportNgramResults(
  results: NgramAnalysisResult,
  filename: string,
  format: 'csv' | 'xlsx'
): void {
  const rows = ngramResultsToRows(results)

  // Per-document breakdown for Excel
  const docRows: Array<{ document: string; phrase: string; count: number }> = []
  for (const doc of results.documents) {
    for (const ngram of doc.ngrams) {
      docRows.push({
        document: doc.documentName,
        phrase: ngram.phrase,
        count: ngram.count,
      })
    }
  }

  if (format === 'csv') {
    downloadCsv(rows, filename)
  } else {
    downloadExcel(
      [
        { name: 'Aggregated', data: rows },
        { name: 'By Document', data: docRows },
      ],
      filename
    )
  }
}

// ============================================================================
// Full Project ZIP Export
// ============================================================================

export async function exportFullProject(
  projectId: string,
  projectName: string,
  options: ProjectExportOptions
): Promise<void> {
  const zip = new JSZip()
  const timestamp = formatDate(new Date())
  const safeName = sanitizeFilename(projectName)

  // Get all documents
  const documents = await window.electron.dbQuery<DocumentRecord>(
    'SELECT * FROM documents WHERE project_id = ?',
    [projectId]
  )

  // 1. Project Summary
  if (options.includeDocumentSummary) {
    const summaryData = await getProjectSummaryData(projectId)
    if (options.format === 'csv') {
      zip.file(`${safeName}-summary.csv`, arrayToCsv(summaryData))
    } else if (options.format === 'xlsx') {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, ws, 'Summary')
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      zip.file(`${safeName}-summary.xlsx`, buffer)
    } else {
      zip.file(`${safeName}-summary.json`, JSON.stringify(summaryData, null, 2))
    }
  }

  // 2. Individual Document Data
  if (options.includeDocumentText || options.includeAnalysisResults) {
    const docsFolder = zip.folder('documents')
    
    for (const doc of documents) {
      const docData = await exportDocument(doc.id, options.includeDocumentText)
      const docFilename = sanitizeFilename(doc.filename.replace('.pdf', ''))
      docsFolder?.file(`${docFilename}.json`, JSON.stringify(docData, null, 2))
    }
  }

  // 3. Keyword Results (if any saved)
  if (options.includeKeywordResults) {
    const keywordResults = await window.electron.dbQuery<{
      id: string
      selected_keywords: string
      results: string
      created_at: string
    }>(
      'SELECT * FROM keyword_results WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [projectId]
    )

    if (keywordResults.length > 0) {
      try {
        const results = JSON.parse(keywordResults[0].results) as BatchKeywordSearchResult
        const rows = keywordResultsToRows(results)
        
        if (options.format === 'csv') {
          zip.file(`${safeName}-keywords.csv`, arrayToCsv(rows))
        } else if (options.format === 'xlsx') {
          const wb = XLSX.utils.book_new()
          const ws = XLSX.utils.json_to_sheet(rows)
          XLSX.utils.book_append_sheet(wb, ws, 'Keywords')
          const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          zip.file(`${safeName}-keywords.xlsx`, buffer)
        } else {
          zip.file(`${safeName}-keywords.json`, JSON.stringify(results, null, 2))
        }
      } catch {
        // Skip invalid data
      }
    }
  }

  // 4. N-gram Results (if any saved)
  if (options.includeNgramResults) {
    const ngramResults = await window.electron.dbQuery<{
      id: string
      ngram_type: number
      results: string
      created_at: string
    }>(
      'SELECT * FROM ngram_results WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
      [projectId]
    )

    if (ngramResults.length > 0) {
      try {
        const results = JSON.parse(ngramResults[0].results) as NgramAnalysisResult
        const rows = ngramResultsToRows(results)
        
        if (options.format === 'csv') {
          zip.file(`${safeName}-ngrams.csv`, arrayToCsv(rows))
        } else if (options.format === 'xlsx') {
          const wb = XLSX.utils.book_new()
          const ws = XLSX.utils.json_to_sheet(rows)
          XLSX.utils.book_append_sheet(wb, ws, 'N-grams')
          const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
          zip.file(`${safeName}-ngrams.xlsx`, buffer)
        } else {
          zip.file(`${safeName}-ngrams.json`, JSON.stringify(results, null, 2))
        }
      } catch {
        // Skip invalid data
      }
    }
  }

  // 5. Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, `${safeName}-export-${timestamp}.zip`)
}
