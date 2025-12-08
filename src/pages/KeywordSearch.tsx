import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, Download, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { KeywordSelector } from '@/components/KeywordSelector'
import {
  searchKeywordsLocal,
  type BatchKeywordSearchResult,
} from '@/services/analysis'
import { exportKeywordResults } from '@/services/export'
import type { DocumentRecord } from '@/services/documents'

export function KeywordSearch() {
  const { projectId } = useParams<{ projectId: string }>()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
  
  // Search state
  const [showKeywordSelector, setShowKeywordSelector] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedListName, setSelectedListName] = useState('')
  const [quickSearch, setQuickSearch] = useState('')
  const [results, setResults] = useState<BatchKeywordSearchResult | null>(null)
  
  // View state
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'matches' | 'name' | 'year'>('matches')
  const [filterKeyword, setFilterKeyword] = useState('')

  useEffect(() => {
    if (projectId) {
      loadDocuments()
    }
  }, [projectId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const result = await window.electron.dbQuery<DocumentRecord>(
        'SELECT * FROM documents WHERE project_id = ? AND extracted_text IS NOT NULL',
        [projectId]
      )
      setDocuments(result)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeywordSelect = (keywords: string[], listName: string) => {
    setSelectedKeywords(keywords)
    setSelectedListName(listName)
  }

  const runSearch = async () => {
    if (documents.length === 0) return
    
    // Combine selected keywords with quick search terms
    const keywords = [...selectedKeywords]
    if (quickSearch.trim()) {
      const quickTerms = quickSearch.split(',').map(t => t.trim()).filter(t => t)
      keywords.push(...quickTerms)
    }

    if (keywords.length === 0) {
      alert('Please select keywords or enter search terms')
      return
    }

    setSearching(true)
    setSearchProgress(0)

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setSearchProgress(p => Math.min(p + 10, 90))
      }, 100)

      const searchResults = await searchKeywordsLocal(documents, keywords, 150)
      
      clearInterval(progressInterval)
      setSearchProgress(100)
      setResults(searchResults)
      
      // Expand first few docs by default
      const topDocs = searchResults.documents.slice(0, 3).map(d => d.documentId)
      setExpandedDocs(new Set(topDocs))
    } catch (error) {
      console.error('Search failed:', error)
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const toggleDocExpand = (docId: string) => {
    const newExpanded = new Set(expandedDocs)
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId)
    } else {
      newExpanded.add(docId)
    }
    setExpandedDocs(newExpanded)
  }

  const sortedResults = useMemo(() => {
    if (!results) return []
    
    let sorted = [...results.documents]
    
    switch (sortBy) {
      case 'matches':
        sorted.sort((a, b) => b.totalMatches - a.totalMatches)
        break
      case 'name':
        sorted.sort((a, b) => a.documentName.localeCompare(b.documentName))
        break
      case 'year':
        sorted.sort((a, b) => (b.reportYear || 0) - (a.reportYear || 0))
        break
    }
    
    return sorted
  }, [results, sortBy])

  const filteredKeywords = useMemo(() => {
    if (!results || !filterKeyword) return results?.keywords || []
    return results.keywords.filter(k => 
      k.toLowerCase().includes(filterKeyword.toLowerCase())
    )
  }, [results, filterKeyword])

  const highlightText = (text: string, keywords: string[]) => {
    if (!keywords.length) return text
    
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, i) => {
      const isMatch = keywords.some(k => part.toLowerCase() === k.toLowerCase())
      return isMatch ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : (
        <span key={i}>{part}</span>
      )
    })
  }

  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx')

  const exportResults = () => {
    if (!results) return
    const filename = `keyword-search-results-${new Date().toISOString().split('T')[0]}`
    exportKeywordResults(results, filename, exportFormat)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/project/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Keyword Search</h1>
          <p className="text-muted-foreground">
            Search across {documents.length} documents
          </p>
        </div>
      </div>

      {/* Search Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Framework Keywords */}
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowKeywordSelector(true)}>
                Select Framework Keywords
              </Button>
              {selectedKeywords.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedKeywords.length} keywords from {selectedListName}
                </span>
              )}
            </div>

            {/* Quick Search */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Quick search: enter terms separated by commas..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                />
              </div>
              <Button onClick={runSearch} disabled={searching || documents.length === 0}>
                <Search className="h-4 w-4 mr-2" />
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Progress */}
            {searching && (
              <Progress value={searchProgress} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Summary */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Results Summary</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="xlsx">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold">{results.summary.totalMatches}</div>
                  <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{results.keywords.length}</div>
                  <div className="text-sm text-muted-foreground">Keywords Searched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {results.documents.filter(d => d.totalMatches > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Documents with Matches</div>
                </div>
              </div>

              {/* Top Keywords */}
              <div>
                <h4 className="text-sm font-medium mb-2">Top Keywords by Frequency</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(results.summary.keywordCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15)
                    .map(([keyword, count]) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm"
                      >
                        {keyword}
                        <span className="text-xs bg-primary/20 px-1.5 rounded-full">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="matches">Most Matches</option>
                <option value="name">Document Name</option>
                <option value="year">Report Year</option>
              </select>
            </div>
            <div className="flex-1" />
            <Input
              placeholder="Filter keywords..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Document Results */}
          <div className="space-y-2">
            {sortedResults.map((doc) => {
              const isExpanded = expandedDocs.has(doc.documentId)
              const hasMatches = doc.totalMatches > 0
              
              return (
                <Card key={doc.documentId} className={!hasMatches ? 'opacity-50' : ''}>
                  <button
                    onClick={() => toggleDocExpand(doc.documentId)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                    disabled={!hasMatches}
                  >
                    {hasMatches ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{doc.documentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.companyName || 'Unknown Company'}
                        {doc.reportYear && ` - ${doc.reportYear}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{doc.totalMatches}</div>
                      <div className="text-xs text-muted-foreground">matches</div>
                    </div>
                  </button>

                  {isExpanded && hasMatches && (
                    <CardContent className="pt-0 border-t">
                      <div className="space-y-4 mt-4">
                        {Object.entries(doc.matches)
                          .filter(([keyword]) => 
                            !filterKeyword || keyword.toLowerCase().includes(filterKeyword.toLowerCase())
                          )
                          .sort((a, b) => b[1].count - a[1].count)
                          .map(([keyword, match]) => (
                            <div key={keyword}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm">{keyword}</span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                  {match.count} occurrences
                                </span>
                              </div>
                              <div className="space-y-2 pl-4">
                                {match.contexts.slice(0, 5).map((ctx, i) => (
                                  <div
                                    key={i}
                                    className="text-sm text-muted-foreground bg-muted/30 p-2 rounded"
                                  >
                                    {highlightText(ctx.text, [keyword])}
                                  </div>
                                ))}
                                {match.contexts.length > 5 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{match.contexts.length - 5} more occurrences
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* No Results */}
      {!results && !searching && documents.length > 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Ready to Search</h2>
            <p className="text-muted-foreground mb-4">
              Select framework keywords or enter search terms to find mentions across your documents
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Documents */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">No Documents Available</h2>
            <p className="text-muted-foreground mb-4">
              Import PDF documents to your project first, then return here to search
            </p>
            <Link to={`/project/${projectId}`}>
              <Button>Go to Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Keyword Selector Modal */}
      <KeywordSelector
        open={showKeywordSelector}
        onClose={() => setShowKeywordSelector(false)}
        onSelect={handleKeywordSelect}
      />
    </div>
  )
}
