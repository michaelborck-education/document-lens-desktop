/**
 * Document Lens API Client
 * 
 * Connects to the document-lens backend for text extraction and analysis.
 * Backend repo: https://github.com/michaelborck-education/document-lens
 */

// Default to localhost:8000 for development
const DEFAULT_API_URL = 'http://localhost:8000'

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL

  constructor() {
    this.initializeUrl()
  }

  private async initializeUrl() {
    try {
      // Get the backend URL from Electron
      if (window.electron) {
        this.baseUrl = await window.electron.getBackendUrl()
      }
    } catch (error) {
      console.warn('Could not get backend URL from Electron, using default:', DEFAULT_API_URL)
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - browser will set it with boundary
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new ApiError(response.status, error.detail || 'Request failed')
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
    formData.append('file', file)
    
    if (options.include_extracted_text !== undefined) {
      formData.append('include_extracted_text', String(options.include_extracted_text))
    }

    return this.requestFormData<ProcessFileResponse>('/files', formData)
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
