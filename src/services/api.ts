/**
 * Document Lens API Client
 * 
 * Connects to the document-lens backend for text extraction and analysis.
 * Backend repo: https://github.com/michaelborck-education/document-lens
 */

import { getBackendUrl, getDefaultBackendUrl } from '@/config/backend'

class ApiClient {
  private baseUrl: string = getDefaultBackendUrl()
  private urlInitialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.initPromise = this.initializeUrl()
  }

  private async initializeUrl() {
    try {
      this.baseUrl = await getBackendUrl()
    } catch (error) {
      console.warn('[API] Could not get backend URL, using default:', this.baseUrl)
    }
    this.urlInitialized = true
  }

  // Ensure URL is initialized before making requests
  private async ensureInitialized(): Promise<void> {
    if (!this.urlInitialized && this.initPromise) {
      await this.initPromise
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
    this.urlInitialized = true
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    await this.ensureInitialized()
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new ApiError(response.status, error.detail || 'Request failed')
    }

    return response.json()
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    await this.ensureInitialized()
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - browser will set it with boundary
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] FormData request failed:', response.status, errorText)
      let detail = 'Request failed'
      try {
        const errorJson = JSON.parse(errorText)
        detail = errorJson.detail || detail
      } catch {
        detail = errorText || detail
      }
      throw new ApiError(response.status, detail)
    }

    return response.json()
  }

  // Health check
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  // File processing - accepts either File or raw bytes with filename
  async processFile(
    file: File,
    options: ProcessFileOptions = {}
  ): Promise<ProcessFileResponse> {
    await this.ensureInitialized()
    const url = `${this.baseUrl}/files`
    
    console.log('[API] processFile called with:', file.name, 'size:', file.size, 'type:', file.type)
    
    // Read file content as ArrayBuffer for debugging
    const fileArrayBuffer = await file.arrayBuffer()
    console.log('[API] File ArrayBuffer size:', fileArrayBuffer.byteLength)
    
    // Verify first bytes (PDF should start with %PDF)
    const firstBytes = new Uint8Array(fileArrayBuffer.slice(0, 10))
    const firstBytesStr = String.fromCharCode(...firstBytes)
    console.log('[API] First bytes:', firstBytesStr)
    
    // Create a fresh Blob from the ArrayBuffer to ensure clean data
    const blob = new Blob([fileArrayBuffer], { type: file.type || 'application/pdf' })
    console.log('[API] Created Blob, size:', blob.size, 'type:', blob.type)
    
    // Build FormData with the blob
    const formData = new FormData()
    formData.append('files', blob, file.name)
    
    // Add form fields - FastAPI expects lowercase 'true'/'false' strings for booleans
    if (options.include_extracted_text) {
      formData.append('include_extracted_text', 'true')
    }
    
    // Debug: Log FormData entries
    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        const blobValue = value as Blob
        console.log(`[API] FormData entry: ${key} = Blob(size=${blobValue.size}, type=${blobValue.type})`)
      } else {
        console.log(`[API] FormData entry: ${key} = ${value}`)
      }
    }
    
    console.log('[API] Sending request to:', url)

    // Make the request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type - browser will set it with boundary
    })
    
    console.log('[API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] FormData request failed:', response.status, errorText)
      let detail = 'Request failed'
      try {
        const errorJson = JSON.parse(errorText)
        detail = errorJson.detail || detail
      } catch {
        detail = errorText || detail
      }
      throw new ApiError(response.status, detail)
    }

    // Backend returns a nested response, extract the first file's result
    const apiResponse: ProcessFilesApiResponse = await response.json()
    
    // Get the first file result
    const fileResult = apiResponse.results?.individual_files?.[0]
    
    if (!fileResult) {
      throw new ApiError(500, 'No file results returned from API')
    }
    
    // Map to the expected response format
    return {
      filename: fileResult.filename,
      content_type: fileResult.content_type,
      size: fileResult.size,
      extracted_text: fileResult.extracted_text,
      metadata: fileResult.metadata,
      // The backend doesn't have 'inferred' in this endpoint, so we leave it undefined
      inferred: undefined
    }
  }

  // Analyze text - uses /text endpoint which returns all analysis in one call
  async analyzeText(text: string): Promise<TextAnalysisApiResponse> {
    return this.request<TextAnalysisApiResponse>('/text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Keyword search
  async searchKeyword(
    text: string,
    keyword: string,
    contextChars: number = 100
  ): Promise<KeywordSearchResponse> {
    return this.request<KeywordSearchResponse>('/search/keyword', {
      method: 'POST',
      body: JSON.stringify({ text, keyword, context_chars: contextChars }),
    })
  }

  // Batch keyword search (multiple keywords)
  async searchKeywords(
    keywords: string[],
    documents: string[],
    documentNames: string[],
    contextChars: number = 100
  ): Promise<BatchKeywordSearchResponse> {
    return this.request<BatchKeywordSearchResponse>('/search/keywords', {
      method: 'POST',
      body: JSON.stringify({
        keywords,
        documents,
        document_names: documentNames,
        context_chars: contextChars,
      }),
    })
  }

  // N-gram analysis
  async analyzeNgrams(
    text: string,
    n: number = 2,
    topK: number = 100,
    filterTerms?: string[]
  ): Promise<NgramResponse> {
    return this.request<NgramResponse>('/ngrams', {
      method: 'POST',
      body: JSON.stringify({
        text,
        n,
        top_k: topK,
        filter_terms: filterTerms,
      }),
    })
  }
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Type definitions for API responses

export interface HealthResponse {
  status: string
  version?: string
}

export interface ProcessFileOptions {
  include_extracted_text?: boolean
}

// Individual file result from the backend
export interface FileResult {
  filename: string
  content_type: string
  size: number
  extracted_text?: {
    full_text: string
    pages?: Array<{
      page_number: number
      text: string
    }>
    total_pages?: number
  }
  metadata?: {
    author?: string
    title?: string
    subject?: string
    creator?: string
    pages?: number
    creation_date?: string
    modification_date?: string
  }
  analysis?: Record<string, unknown>
}

// Full response from /files endpoint
export interface ProcessFilesApiResponse {
  service: string
  version: string
  files_processed: number
  analysis_type: string
  processing_time: number
  results: {
    individual_files: FileResult[]
    cross_analysis?: Record<string, unknown>
    summary?: {
      total_files: number
      total_text_length: number
      supported_formats: string[]
      metadata_extracted: boolean
    }
  }
}

// Simplified response for single file (what we extract from the API response)
export interface ProcessFileResponse {
  filename: string
  content_type: string
  size: number
  extracted_text?: {
    full_text: string
    pages?: Array<{
      page_number: number
      text: string
    }>
    total_pages?: number
  }
  metadata?: {
    author?: string
    title?: string
    subject?: string
    creator?: string
    creation_date?: string
    modification_date?: string
  }
  inferred?: {
    probable_year?: number
    probable_company?: string
    document_type?: string
  }
}

// Response from /text endpoint - all analysis in one call
export interface TextAnalysisApiResponse {
  service: string
  version: string
  content_type: string
  analysis: {
    text_metrics: {
      word_count: number
      sentence_count: number
      paragraph_count: number
      avg_words_per_sentence: number
    }
    readability: {
      flesch_score: number
      flesch_kincaid_grade: number
      interpretation: string
    }
    writing_quality: {
      passive_voice_percentage: number
      sentence_variety: number
      academic_tone: number
      transition_words: number
      hedging_language: number
    }
    word_analysis: {
      unique_words: string[]
      vocabulary_richness: number
      top_words: Array<{ word: string; count: number; size?: number }>
      bigrams: Array<{ phrase: string; count: number }>
      trigrams: Array<{ phrase: string; count: number }>
    }
    ner?: {
      entities: Array<{ text: string; label: string }>
    }
  }
  processing_time: number
}

// Legacy interfaces for backwards compatibility
export interface ReadabilityResponse {
  flesch_score: number
  flesch_kincaid_grade: number
  interpretation: string
}

export interface WritingQualityResponse {
  passive_voice_percentage: number
  sentence_variety: number
  academic_tone: number
  transition_words: number
  hedging_language: number
}

export interface KeywordSearchResponse {
  keyword: string
  count: number
  contexts: Array<{
    text: string
    position: number
  }>
}

export interface BatchKeywordSearchResponse {
  results: Record<string, Record<string, {
    count: number
    contexts: Array<{
      text: string
      position: number
    }>
  }>>
}

export interface NgramResponse {
  ngrams: Array<{
    phrase: string
    count: number
  }>
  n: number
  total_ngrams: number
}

export interface WordAnalysisResponse {
  total_words: number
  unique_words: number
  top_words: Array<{
    word: string
    count: number
    frequency: number
  }>
}

// Export singleton instance
export const api = new ApiClient()

// Export class for testing
export { ApiClient }
