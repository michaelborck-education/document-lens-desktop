import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Cloud,
  TrendingUp,
  Grid3X3,
  Radar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpButton } from '@/components/HelpButton'
import {
  WordCloud,
  KeywordBarChart,
  KeywordHeatmap,
  TrendLineChart,
  FrameworkRadarChart,
  GroupedBarChart,
  ChartExportButton,
  type WordCloudWord,
  type KeywordBarData,
  type HeatmapCell,
  type TrendDataPoint,
  type RadarDataPoint,
  type GroupedBarDataPoint,
} from '@/components/charts'
import { KeywordSelector } from '@/components/KeywordSelector'
import { searchKeywordsLocal, type BatchKeywordSearchResult } from '@/services/analysis'
import type { DocumentRecord } from '@/services/documents'

export function Visualizations() {
  const { projectId } = useParams<{ projectId: string }>()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  // Keyword selection
  const [showKeywordSelector, setShowKeywordSelector] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [selectedListName, setSelectedListName] = useState('')
  const [searchResults, setSearchResults] = useState<BatchKeywordSearchResult | null>(null)

  // Chart refs for export
  const wordCloudRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)
  const heatmapRef = useRef<HTMLDivElement>(null)
  const trendChartRef = useRef<HTMLDivElement>(null)
  const radarChartRef = useRef<HTMLDivElement>(null)
  const groupedBarRef = useRef<HTMLDivElement>(null)

  // LocalStorage key for persisting keyword selection
  const storageKey = `visualization-keywords-${projectId}`

  useEffect(() => {
    if (projectId) {
      loadDocuments()
    }
  }, [projectId])

  // Load saved keywords after documents are loaded
  useEffect(() => {
    if (!loading && documents.length > 0 && !searchResults) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const { keywords, listName } = JSON.parse(saved)
          if (keywords?.length > 0) {
            // Auto-run analysis with saved keywords
            handleKeywordSelect(keywords, listName || 'Saved Selection')
          }
        } catch (e) {
          console.warn('Failed to load saved keywords:', e)
          localStorage.removeItem(storageKey)
        }
      }
    }
  }, [loading, documents.length])

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

  const handleKeywordSelect = async (keywords: string[], listName: string) => {
    setSelectedKeywords(keywords)
    setSelectedListName(listName)
    setShowKeywordSelector(false)

    // Save to localStorage for persistence
    if (keywords.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({ keywords, listName }))
    } else {
      localStorage.removeItem(storageKey)
    }

    if (keywords.length === 0 || documents.length === 0) {
      setSearchResults(null)
      return
    }

    setAnalyzing(true)
    try {
      const results = await searchKeywordsLocal(documents, keywords, 100)
      setSearchResults(results)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Transform data for Word Cloud
  const wordCloudData: WordCloudWord[] = useMemo(() => {
    if (!searchResults) return []
    return Object.entries(searchResults.summary.keywordCounts)
      .filter(([_, count]) => count > 0)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
  }, [searchResults])

  // Transform data for Bar Chart
  const barChartData: KeywordBarData[] = useMemo(() => {
    if (!searchResults) return []
    return Object.entries(searchResults.summary.keywordCounts)
      .filter(([_, count]) => count > 0)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [searchResults])

  // Transform data for Heatmap
  const heatmapData = useMemo(() => {
    if (!searchResults) return { cells: [], keywords: [], documents: [] }

    const keywords = Object.entries(searchResults.summary.keywordCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([k]) => k)

    const docs = searchResults.documents
      .filter((d) => d.totalMatches > 0)
      .slice(0, 15)
      .map((d) => ({ id: d.documentId, name: d.documentName }))

    const cells: HeatmapCell[] = []
    for (const doc of searchResults.documents) {
      for (const [keyword, match] of Object.entries(doc.matches)) {
        if (keywords.includes(keyword)) {
          cells.push({
            keyword,
            documentName: doc.documentName,
            documentId: doc.documentId,
            value: match.count,
          })
        }
      }
    }

    return { cells, keywords, documents: docs }
  }, [searchResults])

  // Transform data for Trend Line (year-over-year)
  const trendData = useMemo(() => {
    if (!searchResults) return { data: [], keywords: [] }

    // Group by year
    const yearData: Record<number, Record<string, number>> = {}
    const topKeywords = Object.entries(searchResults.summary.keywordCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k)

    for (const doc of searchResults.documents) {
      const year = doc.reportYear
      if (!year) continue
      if (!yearData[year]) {
        yearData[year] = {}
        topKeywords.forEach((k) => (yearData[year][k] = 0))
      }
      for (const [keyword, match] of Object.entries(doc.matches)) {
        if (topKeywords.includes(keyword)) {
          yearData[year][keyword] =
            (yearData[year][keyword] || 0) + match.count
        }
      }
    }

    const data: TrendDataPoint[] = Object.entries(yearData)
      .map(([year, keywords]) => ({
        year: parseInt(year),
        ...keywords,
      }))
      .sort((a, b) => a.year - b.year)

    return { data, keywords: topKeywords }
  }, [searchResults])

  // Transform data for Radar Chart (framework categories)
  const radarData = useMemo(() => {
    if (!searchResults || !selectedListName) return { data: [], dataKeys: [] }

    // Group keywords by category (simplified - would need actual category data)
    // For now, create synthetic categories from keyword prefixes or group by first letter
    const categories: Record<string, number> = {}
    
    // Try to detect framework-based categories
    for (const [keyword, count] of Object.entries(searchResults.summary.keywordCounts)) {
      if (count === 0) continue
      
      // Simple categorization based on common sustainability terms
      let category = 'Other'
      const lowerKeyword = keyword.toLowerCase()
      
      if (lowerKeyword.includes('carbon') || lowerKeyword.includes('emission') || lowerKeyword.includes('climate')) {
        category = 'Climate'
      } else if (lowerKeyword.includes('water') || lowerKeyword.includes('waste') || lowerKeyword.includes('energy')) {
        category = 'Environment'
      } else if (lowerKeyword.includes('diversity') || lowerKeyword.includes('employee') || lowerKeyword.includes('safety')) {
        category = 'Social'
      } else if (lowerKeyword.includes('governance') || lowerKeyword.includes('board') || lowerKeyword.includes('risk')) {
        category = 'Governance'
      } else if (lowerKeyword.includes('sustainable') || lowerKeyword.includes('esg')) {
        category = 'Sustainability'
      }
      
      categories[category] = (categories[category] || 0) + count
    }

    const data: RadarDataPoint[] = Object.entries(categories).map(([category, value]) => ({
      category,
      value,
    }))

    return {
      data,
      dataKeys: [{ key: 'value', name: selectedListName, color: '#3b82f6' }],
    }
  }, [searchResults, selectedListName])

  // Transform data for Grouped Bar Chart (documents comparison)
  const groupedBarData = useMemo(() => {
    if (!searchResults) return { data: [], dataKeys: [] }

    const topKeywords = Object.entries(searchResults.summary.keywordCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k)

    const topDocs = searchResults.documents
      .filter((d) => d.totalMatches > 0)
      .slice(0, 8)

    const data: GroupedBarDataPoint[] = topDocs.map((doc) => {
      const point: GroupedBarDataPoint = {
        name: doc.documentName.length > 20
          ? doc.documentName.substring(0, 18) + '...'
          : doc.documentName,
      }
      for (const keyword of topKeywords) {
        point[keyword] = doc.matches[keyword]?.count || 0
      }
      return point
    })

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
    const dataKeys = topKeywords.map((k, i) => ({
      key: k,
      name: k,
      color: colors[i % colors.length],
    }))

    return { data, dataKeys }
  }, [searchResults])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-96 bg-muted rounded" />
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Visualizations</h1>
            <HelpButton section="user-guide" tooltip="Learn about visualizations" />
          </div>
          <p className="text-muted-foreground">
            Explore keyword patterns across {documents.length} documents
          </p>
        </div>
      </div>

      {/* Keyword Selection */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button onClick={() => setShowKeywordSelector(true)}>
              Select Framework Keywords
            </Button>
            {selectedKeywords.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedKeywords.length} keywords from {selectedListName}
              </span>
            )}
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {searchResults ? (
        <Tabs defaultValue="wordcloud">
          <TabsList className="mb-4">
            <TabsTrigger value="wordcloud">
              <Cloud className="h-4 w-4 mr-2" />
              Word Cloud
            </TabsTrigger>
            <TabsTrigger value="bar">
              <BarChart3 className="h-4 w-4 mr-2" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="heatmap">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="trend">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="radar">
              <Radar className="h-4 w-4 mr-2" />
              Radar
            </TabsTrigger>
            <TabsTrigger value="grouped">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparison
            </TabsTrigger>
          </TabsList>

          {/* Word Cloud */}
          <TabsContent value="wordcloud">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Keyword Word Cloud</CardTitle>
                <ChartExportButton chartRef={wordCloudRef} filename="wordcloud" />
              </CardHeader>
              <CardContent>
                <div ref={wordCloudRef}>
                  <WordCloud words={wordCloudData} width={800} height={500} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bar Chart */}
          <TabsContent value="bar">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Keywords by Frequency</CardTitle>
                <ChartExportButton chartRef={barChartRef} filename="keyword-frequency" />
              </CardHeader>
              <CardContent>
                <div ref={barChartRef}>
                  <KeywordBarChart data={barChartData} height={500} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heatmap */}
          <TabsContent value="heatmap">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Keywords x Documents Matrix</CardTitle>
                <ChartExportButton chartRef={heatmapRef} filename="keyword-heatmap" />
              </CardHeader>
              <CardContent>
                <div ref={heatmapRef}>
                  <KeywordHeatmap
                    data={heatmapData.cells}
                    keywords={heatmapData.keywords}
                    documents={heatmapData.documents}
                    height={500}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trend Line */}
          <TabsContent value="trend">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Year-over-Year Keyword Trends</CardTitle>
                <ChartExportButton chartRef={trendChartRef} filename="keyword-trends" />
              </CardHeader>
              <CardContent>
                <div ref={trendChartRef}>
                  {trendData.data.length > 1 ? (
                    <TrendLineChart
                      data={trendData.data}
                      keywords={trendData.keywords}
                      height={400}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Need documents from multiple years to show trends.
                      <br />
                      Add report year metadata to your documents.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Radar Chart */}
          <TabsContent value="radar">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Category Coverage</CardTitle>
                <ChartExportButton chartRef={radarChartRef} filename="category-radar" />
              </CardHeader>
              <CardContent>
                <div ref={radarChartRef}>
                  <FrameworkRadarChart
                    data={radarData.data}
                    dataKeys={radarData.dataKeys}
                    height={450}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grouped Bar Chart */}
          <TabsContent value="grouped">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Comparison</CardTitle>
                <ChartExportButton chartRef={groupedBarRef} filename="document-comparison" />
              </CardHeader>
              <CardContent>
                <div ref={groupedBarRef}>
                  <GroupedBarChart
                    data={groupedBarData.data}
                    dataKeys={groupedBarData.dataKeys}
                    height={450}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Select Keywords to Visualize</h2>
            <p className="text-muted-foreground mb-4">
              Choose a keyword framework to generate visualizations of keyword
              distribution across your documents
            </p>
            <Button onClick={() => setShowKeywordSelector(true)}>
              Select Keywords
            </Button>
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
