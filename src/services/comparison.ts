/**
 * Comparison Service
 *
 * Provides comparative analysis between two document collections.
 * Compares sentiment, keyword coverage, domain distribution, and writing quality.
 */

import { api } from './api'
import { getCollectionTexts } from './collections'
import type { SentimentResponse, DomainMappingResponse } from './api'

// ============================================================================
// Types
// ============================================================================

export interface ComparisonMetrics {
  sentiment: {
    collectionA: AggregatedSentiment
    collectionB: AggregatedSentiment
  }
  keywords: {
    collectionA: KeywordCoverage
    collectionB: KeywordCoverage
    keywords: string[]
  }
  domains: {
    collectionA: DomainDistribution
    collectionB: DomainDistribution
    domains: string[]
  }
  writingQuality: {
    collectionA: AggregatedWritingQuality
    collectionB: AggregatedWritingQuality
  }
}

export interface AggregatedSentiment {
  averageScore: number  // -1 to 1
  distribution: {
    positive: number
    negative: number
    neutral: number
    mixed: number
  }
  documentCount: number
}

export interface KeywordCoverage {
  byKeyword: Record<string, {
    documentCount: number
    totalOccurrences: number
    percentage: number  // % of documents containing keyword
  }>
  totalDocuments: number
}

export interface DomainDistribution {
  byDomain: Record<string, {
    averageScore: number
    documentCount: number
    percentage: number
  }>
  primaryDomainCounts: Record<string, number>
  totalDocuments: number
}

export interface AggregatedWritingQuality {
  averageReadability: number
  averagePassiveVoice: number
  averageSentenceVariety: number
  averageAcademicTone: number
  documentCount: number
}

export interface ComparisonProgress {
  phase: 'loading' | 'sentiment' | 'keywords' | 'domains' | 'writing' | 'complete'
  current: number
  total: number
  message: string
}

// ============================================================================
// Main Comparison Function
// ============================================================================

/**
 * Compare two collections across all metrics
 */
export async function compareCollections(
  collectionAId: string,
  collectionBId: string,
  keywords: string[],
  domains: string[],
  onProgress?: (progress: ComparisonProgress) => void
): Promise<ComparisonMetrics> {
  // Load texts for both collections
  onProgress?.({
    phase: 'loading',
    current: 0,
    total: 4,
    message: 'Loading collection documents...'
  })

  const [textsA, textsB] = await Promise.all([
    getCollectionTexts(collectionAId),
    getCollectionTexts(collectionBId)
  ])

  // Analyze sentiment
  onProgress?.({
    phase: 'sentiment',
    current: 1,
    total: 4,
    message: 'Analyzing sentiment...'
  })

  const [sentimentA, sentimentB] = await Promise.all([
    analyzeCollectionSentiment(textsA),
    analyzeCollectionSentiment(textsB)
  ])

  // Analyze keyword coverage
  onProgress?.({
    phase: 'keywords',
    current: 2,
    total: 4,
    message: 'Analyzing keyword coverage...'
  })

  const [keywordsA, keywordsB] = await Promise.all([
    analyzeKeywordCoverage(textsA, keywords),
    analyzeKeywordCoverage(textsB, keywords)
  ])

  // Analyze domain distribution
  onProgress?.({
    phase: 'domains',
    current: 3,
    total: 4,
    message: 'Analyzing domain distribution...'
  })

  const [domainsA, domainsB] = await Promise.all([
    analyzeDomainDistribution(textsA, domains),
    analyzeDomainDistribution(textsB, domains)
  ])

  // Analyze writing quality
  onProgress?.({
    phase: 'writing',
    current: 4,
    total: 4,
    message: 'Analyzing writing quality...'
  })

  const [writingA, writingB] = await Promise.all([
    analyzeWritingQuality(textsA),
    analyzeWritingQuality(textsB)
  ])

  onProgress?.({
    phase: 'complete',
    current: 4,
    total: 4,
    message: 'Comparison complete'
  })

  return {
    sentiment: {
      collectionA: sentimentA,
      collectionB: sentimentB
    },
    keywords: {
      collectionA: keywordsA,
      collectionB: keywordsB,
      keywords
    },
    domains: {
      collectionA: domainsA,
      collectionB: domainsB,
      domains
    },
    writingQuality: {
      collectionA: writingA,
      collectionB: writingB
    }
  }
}

// ============================================================================
// Individual Analysis Functions
// ============================================================================

/**
 * Analyze sentiment for a collection of documents
 */
async function analyzeCollectionSentiment(
  documents: Array<{ documentId: string; text: string; documentName: string }>
): Promise<AggregatedSentiment> {
  if (documents.length === 0) {
    return {
      averageScore: 0,
      distribution: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
      documentCount: 0
    }
  }

  try {
    // Use batch API if available
    const batchDocs = documents.map(d => ({ id: d.documentId, text: d.text }))
    const response = await api.analyzeSentimentBatch(batchDocs)

    const distribution = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
    let totalScore = 0

    for (const result of response.results) {
      totalScore += result.sentiment.score
      distribution[result.sentiment.sentiment]++
    }

    return {
      averageScore: totalScore / response.results.length,
      distribution,
      documentCount: documents.length
    }
  } catch (error) {
    // Fallback to individual requests if batch fails
    console.warn('Batch sentiment failed, falling back to individual:', error)

    const distribution = { positive: 0, negative: 0, neutral: 0, mixed: 0 }
    let totalScore = 0
    let processed = 0

    for (const doc of documents) {
      try {
        const result = await api.analyzeSentiment(doc.text)
        totalScore += result.score
        distribution[result.sentiment]++
        processed++
      } catch {
        // Skip failed documents
      }
    }

    return {
      averageScore: processed > 0 ? totalScore / processed : 0,
      distribution,
      documentCount: processed
    }
  }
}

/**
 * Analyze keyword coverage for a collection
 */
async function analyzeKeywordCoverage(
  documents: Array<{ documentId: string; text: string; documentName: string }>,
  keywords: string[]
): Promise<KeywordCoverage> {
  if (documents.length === 0 || keywords.length === 0) {
    return {
      byKeyword: {},
      totalDocuments: documents.length
    }
  }

  const byKeyword: Record<string, {
    documentCount: number
    totalOccurrences: number
    percentage: number
  }> = {}

  // Initialize all keywords
  for (const keyword of keywords) {
    byKeyword[keyword] = {
      documentCount: 0,
      totalOccurrences: 0,
      percentage: 0
    }
  }

  // Process each document
  for (const doc of documents) {
    const textLower = doc.text.toLowerCase()

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      const regex = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'gi')
      const matches = textLower.match(regex) || []

      if (matches.length > 0) {
        byKeyword[keyword].documentCount++
        byKeyword[keyword].totalOccurrences += matches.length
      }
    }
  }

  // Calculate percentages
  for (const keyword of keywords) {
    byKeyword[keyword].percentage = documents.length > 0
      ? (byKeyword[keyword].documentCount / documents.length) * 100
      : 0
  }

  return {
    byKeyword,
    totalDocuments: documents.length
  }
}

/**
 * Analyze domain distribution for a collection
 */
async function analyzeDomainDistribution(
  documents: Array<{ documentId: string; text: string; documentName: string }>,
  domains: string[]
): Promise<DomainDistribution> {
  if (documents.length === 0 || domains.length === 0) {
    return {
      byDomain: {},
      primaryDomainCounts: {},
      totalDocuments: documents.length
    }
  }

  try {
    // Use batch API
    const batchDocs = documents.map(d => ({ id: d.documentId, text: d.text }))
    const response = await api.mapDomainsBatch(batchDocs, domains)

    const byDomain: Record<string, {
      averageScore: number
      documentCount: number
      percentage: number
    }> = {}

    const primaryDomainCounts: Record<string, number> = {}

    // Initialize domains
    for (const domain of domains) {
      byDomain[domain] = { averageScore: 0, documentCount: 0, percentage: 0 }
      primaryDomainCounts[domain] = 0
    }

    // Aggregate results
    for (const result of response.results) {
      primaryDomainCounts[result.mapping.primary_domain] =
        (primaryDomainCounts[result.mapping.primary_domain] || 0) + 1

      for (const mapping of result.mapping.mappings) {
        if (byDomain[mapping.domain]) {
          byDomain[mapping.domain].averageScore += mapping.score
          if (mapping.score > 0.3) {
            byDomain[mapping.domain].documentCount++
          }
        }
      }
    }

    // Calculate averages and percentages
    for (const domain of domains) {
      if (response.results.length > 0) {
        byDomain[domain].averageScore /= response.results.length
        byDomain[domain].percentage =
          (byDomain[domain].documentCount / documents.length) * 100
      }
    }

    return {
      byDomain,
      primaryDomainCounts,
      totalDocuments: documents.length
    }
  } catch (error) {
    console.warn('Batch domain mapping failed:', error)

    // Return empty result on failure
    const byDomain: Record<string, {
      averageScore: number
      documentCount: number
      percentage: number
    }> = {}

    for (const domain of domains) {
      byDomain[domain] = { averageScore: 0, documentCount: 0, percentage: 0 }
    }

    return {
      byDomain,
      primaryDomainCounts: {},
      totalDocuments: documents.length
    }
  }
}

/**
 * Analyze writing quality for a collection (uses stored analysis results)
 */
async function analyzeWritingQuality(
  documents: Array<{ documentId: string; text: string; documentName: string }>
): Promise<AggregatedWritingQuality> {
  if (documents.length === 0) {
    return {
      averageReadability: 0,
      averagePassiveVoice: 0,
      averageSentenceVariety: 0,
      averageAcademicTone: 0,
      documentCount: 0
    }
  }

  // Query stored analysis results
  const docIds = documents.map(d => d.documentId)
  const placeholders = docIds.map(() => '?').join(', ')

  let totalReadability = 0
  let totalPassiveVoice = 0
  let totalSentenceVariety = 0
  let totalAcademicTone = 0
  let count = 0

  try {
    const results = await window.electron.dbQuery<{
      document_id: string
      analysis_type: string
      results: string
    }>(
      `SELECT document_id, analysis_type, results
       FROM analysis_results
       WHERE document_id IN (${placeholders})
       AND analysis_type IN ('readability', 'writing_quality')`,
      docIds
    )

    // Group by document
    const byDocument: Record<string, { readability?: Record<string, number>; writingQuality?: Record<string, number> }> = {}

    for (const row of results) {
      if (!byDocument[row.document_id]) {
        byDocument[row.document_id] = {}
      }

      try {
        const parsed = JSON.parse(row.results)
        if (row.analysis_type === 'readability') {
          byDocument[row.document_id].readability = parsed
        } else if (row.analysis_type === 'writing_quality') {
          byDocument[row.document_id].writingQuality = parsed
        }
      } catch {
        // Skip invalid JSON
      }
    }

    // Aggregate
    for (const docData of Object.values(byDocument)) {
      if (docData.readability || docData.writingQuality) {
        count++
        totalReadability += docData.readability?.flesch_score || docData.readability?.flesch_reading_ease || 0
        totalPassiveVoice += docData.writingQuality?.passive_voice_percentage || 0
        totalSentenceVariety += docData.writingQuality?.sentence_variety || 0
        totalAcademicTone += docData.writingQuality?.academic_tone || 0
      }
    }
  } catch (error) {
    console.warn('Failed to load writing quality:', error)
  }

  return {
    averageReadability: count > 0 ? totalReadability / count : 0,
    averagePassiveVoice: count > 0 ? totalPassiveVoice / count : 0,
    averageSentenceVariety: count > 0 ? totalSentenceVariety / count : 0,
    averageAcademicTone: count > 0 ? totalAcademicTone / count : 0,
    documentCount: count
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get comparison summary text
 */
export function getComparisonSummary(metrics: ComparisonMetrics): string {
  const parts: string[] = []

  // Sentiment comparison
  const sentDiff = metrics.sentiment.collectionA.averageScore - metrics.sentiment.collectionB.averageScore
  if (Math.abs(sentDiff) > 0.1) {
    const morePositive = sentDiff > 0 ? 'Collection A' : 'Collection B'
    parts.push(`${morePositive} has more positive sentiment`)
  } else {
    parts.push('Similar sentiment between collections')
  }

  // Keyword coverage
  const avgCoverageA = Object.values(metrics.keywords.collectionA.byKeyword)
    .reduce((sum, k) => sum + k.percentage, 0) / Math.max(1, Object.keys(metrics.keywords.collectionA.byKeyword).length)
  const avgCoverageB = Object.values(metrics.keywords.collectionB.byKeyword)
    .reduce((sum, k) => sum + k.percentage, 0) / Math.max(1, Object.keys(metrics.keywords.collectionB.byKeyword).length)

  if (Math.abs(avgCoverageA - avgCoverageB) > 10) {
    const higherCoverage = avgCoverageA > avgCoverageB ? 'Collection A' : 'Collection B'
    parts.push(`${higherCoverage} has higher keyword coverage`)
  }

  // Writing quality
  const readDiff = metrics.writingQuality.collectionA.averageReadability -
    metrics.writingQuality.collectionB.averageReadability

  if (Math.abs(readDiff) > 5) {
    const moreReadable = readDiff > 0 ? 'Collection A' : 'Collection B'
    parts.push(`${moreReadable} is more readable`)
  }

  return parts.join('. ') + '.'
}
