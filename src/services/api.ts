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

  // File processing
  async processFile(
    file: File,
    options: ProcessFileOptions = {}
  ): Promise<ProcessFileResponse> {
    const formData = new FormData()
    // Backend expects 'files' (plural) as the field name
    formData.append('files', file)
    
    // Add form fields - FastAPI expects lowercase 'true'/'false' strings for booleans
    if (options.include_extracted_text) {
      formData.append('include_extracted_text', 'true')
    }
    
    console.log('[API] Sending file:', file.name, 'size:', file.size, 'type:', file.type)

    // Backend returns a nested response, extract the first file's result
    const apiResponse = await this.requestFormData<ProcessFilesApiResponse>('/files', formData)
    
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

  // Analyze text
  async analyzeText(text: string): Promise<AnalyzeTextResponse> {
    return this.request<AnalyzeTextResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Readability analysis
  async analyzeReadability(text: string): Promise<ReadabilityResponse> {
    return this.request<ReadabilityResponse>('/readability', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Writing quality analysis
  async analyzeWritingQuality(text: string): Promise<WritingQualityResponse> {
    return this.request<WritingQualityResponse>('/writing-quality', {
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
    return this.request<NgramResponse>('/advanced/ngrams', {
      method: 'POST',
      body: JSON.stringify({
        text,
        n,
        top_k: topK,
        filter_terms: filterTerms,
      }),
    })
  }

  // Word analysis (frequency, etc.)
  async analyzeWords(text: string, topK: number = 100): Promise<WordAnalysisResponse> {
    return this.request<WordAnalysisResponse>('/words', {
      method: 'POST',
      body: JSON.stringify({ text, top_k: topK }),
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

export interface AnalyzeTextResponse {
  word_count: number
  sentence_count: number
  paragraph_count: number
  readability: ReadabilityResponse
  writing_quality: WritingQualityResponse
}

export interface ReadabilityResponse {
  flesch_reading_ease: number
  flesch_kincaid_grade: number
  gunning_fog: number
  smog_index: number
  coleman_liau_index: number
  automated_readability_index: number
  average_grade_level: number
  reading_time_minutes: number
}

export interface WritingQualityResponse {
  average_sentence_length: number
  average_word_length: number
  vocabulary_richness: number
  passive_voice_percentage: number
  complex_word_percentage: number
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
