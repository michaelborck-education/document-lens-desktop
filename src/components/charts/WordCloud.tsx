import { useMemo } from 'react'
import { Wordcloud } from '@visx/wordcloud'
import { scaleLinear } from '@visx/scale'
import { Text } from '@visx/text'

export interface WordCloudWord {
  text: string
  value: number
}

interface WordCloudProps {
  words: WordCloudWord[]
  width?: number
  height?: number
  onWordClick?: (word: string) => void
}

const colors = [
  '#1e40af', // blue-800
  '#1d4ed8', // blue-700
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#0891b2', // cyan-600
  '#0d9488', // teal-600
  '#059669', // emerald-600
  '#16a34a', // green-600
  '#7c3aed', // violet-600
  '#db2777', // pink-600
]

export function WordCloud({
  words,
  width = 600,
  height = 400,
  onWordClick,
}: WordCloudProps) {
  // Sort words by value descending and limit
  const sortedWords = useMemo(() => {
    return [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, 80) // Limit words for better layout
  }, [words])

  // Create font scale based on value range
  const fontScale = useMemo(() => {
    if (sortedWords.length === 0) return scaleLinear({ domain: [0, 1], range: [16, 48] })

    const values = sortedWords.map((w) => w.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Ensure we have a meaningful range even if all values are the same
    const domainMin = min
    const domainMax = max === min ? min + 1 : max

    return scaleLinear({
      domain: [domainMin, domainMax],
      range: [16, 56], // Min 16px, max 56px font size
    })
  }, [sortedWords])

  const fontSizeSetter = (datum: WordCloudWord) => fontScale(datum.value)

  // Use deterministic random for consistent layout
  const fixedValueGenerator = () => 0.5

  if (words.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ width, height }}
      >
        No data to display
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height}>
        <Wordcloud
          words={sortedWords}
          width={width}
          height={height}
          fontSize={fontSizeSetter}
          font="Inter, system-ui, sans-serif"
          padding={3}
          spiral="archimedean"
          rotate={0}
          random={fixedValueGenerator}
        >
          {(cloudWords) =>
            cloudWords.map((w, i) => (
              <Text
                key={`${w.text}-${i}`}
                x={width / 2 + (w.x || 0)}
                y={height / 2 + (w.y || 0)}
                fill={colors[i % colors.length]}
                textAnchor="middle"
                verticalAnchor="middle"
                fontSize={w.size}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={i < 5 ? 600 : i < 15 ? 500 : 400}
                style={{
                  cursor: onWordClick ? 'pointer' : 'default',
                }}
                onClick={() => w.text && onWordClick?.(w.text)}
              >
                {w.text}
              </Text>
            ))
          }
        </Wordcloud>
      </svg>
    </div>
  )
}
