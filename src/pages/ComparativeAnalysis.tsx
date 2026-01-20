/**
 * ComparativeAnalysis Page
 *
 * Side-by-side comparison of two document collections.
 * Shows sentiment, keyword coverage, domain distribution, and writing quality.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, GitCompare, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HelpButton } from '@/components/HelpButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  SentimentComparisonChart,
  SentimentScoreChart,
  KeywordComparisonChart,
  DomainRadarChart,
  DomainBarChart,
  WritingQualityRadarChart,
  WritingQualityBarChart,
  ComparisonSummaryCards,
} from '@/components/ComparisonCharts'
import {
  compareCollections,
  getComparisonSummary,
  type ComparisonMetrics,
  type ComparisonProgress,
} from '@/services/comparison'
import {
  getProjectCollections,
  getCollectionWithDocuments,
  type Collection,
} from '@/services/collections'
import {
  getActiveProfile,
  getEnabledKeywords,
  type ParsedAnalysisProfile,
} from '@/services/profiles'

export function ComparativeAnalysis() {
  const { projectId } = useParams<{ projectId: string }>()

  // State
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedA, setSelectedA] = useState<string | null>(null)
  const [selectedB, setSelectedB] = useState<string | null>(null)
  const [collectionAName, setCollectionAName] = useState('')
  const [collectionBName, setCollectionBName] = useState('')
  const [profile, setProfile] = useState<ParsedAnalysisProfile | null>(null)
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [progress, setProgress] = useState<ComparisonProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load collections and active profile
  useEffect(() => {
    if (projectId) {
      loadData()
    }
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [colls, activeProfile] = await Promise.all([
        getProjectCollections(projectId!),
        getActiveProfile(projectId!),
      ])
      setCollections(colls)
      setProfile(activeProfile)

      // Auto-select first two collections if available
      if (colls.length >= 2) {
        setSelectedA(colls[0].id)
        setSelectedB(colls[1].id)
        setCollectionAName(colls[0].name)
        setCollectionBName(colls[1].name)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectionAChange = async (id: string) => {
    setSelectedA(id)
    const coll = collections.find((c) => c.id === id)
    setCollectionAName(coll?.name || 'Collection A')
    setMetrics(null)
  }

  const handleCollectionBChange = async (id: string) => {
    setSelectedB(id)
    const coll = collections.find((c) => c.id === id)
    setCollectionBName(coll?.name || 'Collection B')
    setMetrics(null)
  }

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return

    setComparing(true)
    setError(null)
    setMetrics(null)

    try {
      // Get keywords from profile or use defaults
      const keywords = profile
        ? getEnabledKeywords(profile.config)
        : ['climate', 'sustainability', 'emissions', 'governance', 'risk']

      // Get domains from profile or use defaults
      const domains = profile?.config.domains.length
        ? profile.config.domains
        : ['Governance', 'Strategy', 'Risk Management', 'Metrics & Targets']

      const result = await compareCollections(
        selectedA,
        selectedB,
        keywords,
        domains,
        setProgress
      )

      setMetrics(result)
    } catch (err) {
      console.error('Comparison failed:', err)
      setError(err instanceof Error ? err.message : 'Comparison failed')
    } finally {
      setComparing(false)
      setProgress(null)
    }
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Comparative Analysis</h1>
            <HelpButton section="analysis-workflows" tooltip="Learn about comparative analysis" />
          </div>
          <p className="text-muted-foreground">
            Compare metrics between two document collections
          </p>
        </div>
      </div>

      {/* Collection Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Select Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length < 2 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Not enough collections
              </h3>
              <p className="text-muted-foreground mb-4">
                Create at least two collections to compare them.
              </p>
              <Link to={`/project/${projectId}`}>
                <Button variant="outline">Go to Project</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Collection A
                  </label>
                  <Select
                    value={selectedA || undefined}
                    onValueChange={handleCollectionAChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((coll) => (
                        <SelectItem
                          key={coll.id}
                          value={coll.id}
                          disabled={coll.id === selectedB}
                        >
                          {coll.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Collection B
                  </label>
                  <Select
                    value={selectedB || undefined}
                    onValueChange={handleCollectionBChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((coll) => (
                        <SelectItem
                          key={coll.id}
                          value={coll.id}
                          disabled={coll.id === selectedA}
                        >
                          {coll.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {profile && (
                <div className="text-sm text-muted-foreground">
                  Using profile: <span className="font-medium">{profile.name}</span>
                  {' '}({getEnabledKeywords(profile.config).length} keywords,{' '}
                  {profile.config.domains.length} domains)
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleCompare}
                  disabled={!selectedA || !selectedB || comparing}
                >
                  {comparing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitCompare className="h-4 w-4 mr-2" />
                  )}
                  {comparing ? 'Analyzing...' : 'Compare Collections'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      {comparing && progress && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{progress.message}</p>
                <p className="text-xs text-muted-foreground">
                  Step {progress.current} of {progress.total}
                </p>
              </div>
            </div>
            <Progress
              value={(progress.current / progress.total) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {metrics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <ComparisonSummaryCards
            metrics={metrics}
            collectionAName={collectionAName}
            collectionBName={collectionBName}
          />

          {/* Summary Text */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                {getComparisonSummary(metrics)}
              </p>
            </CardContent>
          </Card>

          {/* Charts Tabs */}
          <Tabs defaultValue="sentiment" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
              <TabsTrigger value="writing">Writing Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="sentiment" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SentimentComparisonChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Average Sentiment Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SentimentScoreChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Keyword Coverage Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <KeywordComparisonChart
                    metrics={metrics}
                    collectionAName={collectionAName}
                    collectionBName={collectionBName}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domains" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Domain Distribution (Radar)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DomainRadarChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Domain Coverage (Bar)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DomainBarChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="writing" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Writing Quality (Radar)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WritingQualityRadarChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Writing Metrics (Bar)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WritingQualityBarChart
                      metrics={metrics}
                      collectionAName={collectionAName}
                      collectionBName={collectionBName}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
