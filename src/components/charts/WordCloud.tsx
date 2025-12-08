import { useMemo } from 'react'
import { Wordcloud } from '@visx/wordcloud'
import { scaleLog } from '@visx/scale'
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

interface WordData extends WordCloudWord {
  font: string
  fontSize: number
  rotate: number
  x: number
  y: number
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
]

export function WordCloud({
  words,
  width = 600,
  height = 400,
  onWordClick,
}: WordCloudProps) {
  const fontScale = useMemo(() => {
    const values = words.map((w) => w.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    return scaleLog({
      domain: [Math.max(min, 1), Math.max(max, 1)],
      range: [14, 64],
    })
  }, [words])

  const fontSizeSetter = (datum: WordCloudWord) => fontScale(datum.value)

  const fixedValueGenerator = () => 0.5

  const wordCloudWords = useMemo(() => {
    return words.slice(0, 100) // Limit to 100 words for performance
  }, [words])

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
    <div className="relative" style={{ width, height }}>
      <Wordcloud
        words={wordCloudWords}
        width={width}
        height={height}
        fontSize={fontSizeSetter}
        font="Inter, system-ui, sans-serif"
        padding={2}
        spiral="archimedean"
        rotate={0}
        random={fixedValueGenerator}
      >
        {(cloudWords) => (
          <g transform={`translate(${width / 2},${height / 2})`}>
            {cloudWords.map((w, i) => {
              const word = w as unknown as WordData
              return (
                <Text
                  key={`${word.text}-${i}`}
                  fill={colors[i % colors.length]}
                  textAnchor="middle"
                  transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`}
                  fontSize={word.fontSize}
                  fontFamily={word.font}
                  fontWeight={word.value > fontScale.domain()[1] * 0.7 ? 600 : 400}
                  style={{
                    cursor: onWordClick ? 'pointer' : 'default',
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => onWordClick?.(word.text)}
                  onMouseOver={(e: React.MouseEvent<SVGTextElement>) => {
                    if (onWordClick) {
                      ;(e.target as SVGElement).style.opacity = '0.7'
                    }
                  }}
                  onMouseOut={(e: React.MouseEvent<SVGTextElement>) => {
                    ;(e.target as SVGElement).style.opacity = '1'
                  }}
                >
                  {word.text}
                </Text>
              )
            })}
          </g>
        )}
      </Wordcloud>
    </div>
  )
}
