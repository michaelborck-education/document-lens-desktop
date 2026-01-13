/**
 * ComparisonCharts Component
 *
 * Multi-series chart visualizations for comparing two collections.
 * Uses Recharts for rendering grouped bar charts and radar charts.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts'
import type { ComparisonMetrics } from '@/services/comparison'

interface ComparisonChartsProps {
  metrics: ComparisonMetrics
  collectionAName: string
  collectionBName: string
}

// Colors for collections
const COLORS = {
  collectionA: '#3b82f6', // blue
  collectionB: '#10b981', // green
}

/**
 * Sentiment Comparison Chart
 */
export function SentimentComparisonChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = [
    {
      name: 'Positive',
      [collectionAName]: metrics.sentiment.collectionA.distribution.positive,
      [collectionBName]: metrics.sentiment.collectionB.distribution.positive,
    },
    {
      name: 'Neutral',
      [collectionAName]: metrics.sentiment.collectionA.distribution.neutral,
      [collectionBName]: metrics.sentiment.collectionB.distribution.neutral,
    },
    {
      name: 'Negative',
      [collectionAName]: metrics.sentiment.collectionA.distribution.negative,
      [collectionBName]: metrics.sentiment.collectionB.distribution.negative,
    },
    {
      name: 'Mixed',
      [collectionAName]: metrics.sentiment.collectionA.distribution.mixed,
      [collectionBName]: metrics.sentiment.collectionB.distribution.mixed,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Documents', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey={collectionAName} fill={COLORS.collectionA} />
        <Bar dataKey={collectionBName} fill={COLORS.collectionB} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Sentiment Score Comparison (average score per collection)
 */
export function SentimentScoreChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = [
    {
      name: collectionAName,
      score: metrics.sentiment.collectionA.averageScore,
      fill: COLORS.collectionA,
    },
    {
      name: collectionBName,
      score: metrics.sentiment.collectionB.averageScore,
      fill: COLORS.collectionB,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis type="number" domain={[-1, 1]} />
        <YAxis type="category" dataKey="name" />
        <Tooltip formatter={(value: number) => value.toFixed(3)} />
        <Bar dataKey="score" name="Average Sentiment">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Keyword Coverage Comparison Chart
 */
export function KeywordComparisonChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = metrics.keywords.keywords.map((keyword) => ({
    name: keyword,
    [collectionAName]: metrics.keywords.collectionA.byKeyword[keyword]?.percentage || 0,
    [collectionBName]: metrics.keywords.collectionB.byKeyword[keyword]?.percentage || 0,
  }))

  // Sort by total coverage
  data.sort((a, b) => {
    const totalA = (a[collectionAName] as number) + (a[collectionBName] as number)
    const totalB = (b[collectionAName] as number) + (b[collectionBName] as number)
    return totalB - totalA
  })

  // Limit to top 10 keywords
  const limitedData = data.slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={limitedData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis type="number" domain={[0, 100]} unit="%" />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Legend />
        <Bar dataKey={collectionAName} fill={COLORS.collectionA} />
        <Bar dataKey={collectionBName} fill={COLORS.collectionB} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Domain Distribution Radar Chart
 */
export function DomainRadarChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = metrics.domains.domains.map((domain) => ({
    domain,
    [collectionAName]: (metrics.domains.collectionA.byDomain[domain]?.averageScore || 0) * 100,
    [collectionBName]: (metrics.domains.collectionB.byDomain[domain]?.averageScore || 0) * 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="domain" />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar
          name={collectionAName}
          dataKey={collectionAName}
          stroke={COLORS.collectionA}
          fill={COLORS.collectionA}
          fillOpacity={0.3}
        />
        <Radar
          name={collectionBName}
          dataKey={collectionBName}
          stroke={COLORS.collectionB}
          fill={COLORS.collectionB}
          fillOpacity={0.3}
        />
        <Legend />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/**
 * Domain Distribution Bar Chart (alternative to radar)
 */
export function DomainBarChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = metrics.domains.domains.map((domain) => ({
    name: domain,
    [collectionAName]: metrics.domains.collectionA.byDomain[domain]?.percentage || 0,
    [collectionBName]: metrics.domains.collectionB.byDomain[domain]?.percentage || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} unit="%" />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Legend />
        <Bar dataKey={collectionAName} fill={COLORS.collectionA} />
        <Bar dataKey={collectionBName} fill={COLORS.collectionB} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Writing Quality Comparison Radar Chart
 */
export function WritingQualityRadarChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = [
    {
      metric: 'Readability',
      [collectionAName]: metrics.writingQuality.collectionA.averageReadability,
      [collectionBName]: metrics.writingQuality.collectionB.averageReadability,
      fullMark: 100,
    },
    {
      metric: 'Sentence Variety',
      [collectionAName]: metrics.writingQuality.collectionA.averageSentenceVariety * 100,
      [collectionBName]: metrics.writingQuality.collectionB.averageSentenceVariety * 100,
      fullMark: 100,
    },
    {
      metric: 'Academic Tone',
      [collectionAName]: metrics.writingQuality.collectionA.averageAcademicTone * 100,
      [collectionBName]: metrics.writingQuality.collectionB.averageAcademicTone * 100,
      fullMark: 100,
    },
    {
      metric: 'Active Voice',
      [collectionAName]: 100 - metrics.writingQuality.collectionA.averagePassiveVoice,
      [collectionBName]: 100 - metrics.writingQuality.collectionB.averagePassiveVoice,
      fullMark: 100,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar
          name={collectionAName}
          dataKey={collectionAName}
          stroke={COLORS.collectionA}
          fill={COLORS.collectionA}
          fillOpacity={0.3}
        />
        <Radar
          name={collectionBName}
          dataKey={collectionBName}
          stroke={COLORS.collectionB}
          fill={COLORS.collectionB}
          fillOpacity={0.3}
        />
        <Legend />
        <Tooltip formatter={(value: number) => value.toFixed(1)} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/**
 * Writing Quality Bar Comparison
 */
export function WritingQualityBarChart({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  const data = [
    {
      name: 'Readability (Flesch)',
      [collectionAName]: metrics.writingQuality.collectionA.averageReadability,
      [collectionBName]: metrics.writingQuality.collectionB.averageReadability,
    },
    {
      name: 'Passive Voice %',
      [collectionAName]: metrics.writingQuality.collectionA.averagePassiveVoice,
      [collectionBName]: metrics.writingQuality.collectionB.averagePassiveVoice,
    },
    {
      name: 'Sentence Variety',
      [collectionAName]: metrics.writingQuality.collectionA.averageSentenceVariety * 100,
      [collectionBName]: metrics.writingQuality.collectionB.averageSentenceVariety * 100,
    },
    {
      name: 'Academic Tone',
      [collectionAName]: metrics.writingQuality.collectionA.averageAcademicTone * 100,
      [collectionBName]: metrics.writingQuality.collectionB.averageAcademicTone * 100,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip formatter={(value: number) => value.toFixed(1)} />
        <Legend />
        <Bar dataKey={collectionAName} fill={COLORS.collectionA} />
        <Bar dataKey={collectionBName} fill={COLORS.collectionB} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Summary Cards Component
 */
export function ComparisonSummaryCards({
  metrics,
  collectionAName,
  collectionBName,
}: ComparisonChartsProps) {
  // Calculate averages for comparison
  const avgKeywordCoverageA =
    Object.values(metrics.keywords.collectionA.byKeyword).reduce(
      (sum, k) => sum + k.percentage,
      0
    ) / Math.max(1, Object.keys(metrics.keywords.collectionA.byKeyword).length)

  const avgKeywordCoverageB =
    Object.values(metrics.keywords.collectionB.byKeyword).reduce(
      (sum, k) => sum + k.percentage,
      0
    ) / Math.max(1, Object.keys(metrics.keywords.collectionB.byKeyword).length)

  const cards = [
    {
      label: 'Sentiment Score',
      valueA: metrics.sentiment.collectionA.averageScore.toFixed(2),
      valueB: metrics.sentiment.collectionB.averageScore.toFixed(2),
      better: metrics.sentiment.collectionA.averageScore > metrics.sentiment.collectionB.averageScore ? 'A' : 'B',
    },
    {
      label: 'Avg Keyword Coverage',
      valueA: `${avgKeywordCoverageA.toFixed(1)}%`,
      valueB: `${avgKeywordCoverageB.toFixed(1)}%`,
      better: avgKeywordCoverageA > avgKeywordCoverageB ? 'A' : 'B',
    },
    {
      label: 'Readability',
      valueA: metrics.writingQuality.collectionA.averageReadability.toFixed(1),
      valueB: metrics.writingQuality.collectionB.averageReadability.toFixed(1),
      better: metrics.writingQuality.collectionA.averageReadability > metrics.writingQuality.collectionB.averageReadability ? 'A' : 'B',
    },
    {
      label: 'Documents',
      valueA: String(metrics.sentiment.collectionA.documentCount),
      valueB: String(metrics.sentiment.collectionB.documentCount),
      better: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">{card.label}</div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs text-muted-foreground">{collectionAName}</div>
              <div
                className={`text-lg font-bold ${
                  card.better === 'A' ? 'text-blue-500' : ''
                }`}
              >
                {card.valueA}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{collectionBName}</div>
              <div
                className={`text-lg font-bold ${
                  card.better === 'B' ? 'text-green-500' : ''
                }`}
              >
                {card.valueB}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
