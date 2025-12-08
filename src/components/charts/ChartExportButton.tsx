import { useRef } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChartExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement>
  filename?: string
}

export function ChartExportButton({
  chartRef,
  filename = 'chart',
}: ChartExportButtonProps) {
  const handleExport = async (format: 'png' | 'svg') => {
    if (!chartRef.current) return

    try {
      // Find SVG element in the chart container
      const svgElement = chartRef.current.querySelector('svg')
      if (!svgElement) {
        // If no SVG, try to capture as canvas
        alert('Chart export is only supported for SVG-based charts')
        return
      }

      if (format === 'svg') {
        // Export as SVG
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.svg`
        link.click()
        
        URL.revokeObjectURL(url)
      } else {
        // Export as PNG
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          alert('Canvas not supported')
          return
        }

        const img = new Image()
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
          // Scale up for better quality
          const scale = 2
          canvas.width = svgElement.clientWidth * scale
          canvas.height = svgElement.clientHeight * scale
          ctx.scale(scale, scale)
          
          // White background
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = pngUrl
              link.download = `${filename}.png`
              link.click()
              URL.revokeObjectURL(pngUrl)
            }
          }, 'image/png')
          
          URL.revokeObjectURL(url)
        }

        img.src = url
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export chart')
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('png')}
        title="Export as PNG"
      >
        <Download className="h-4 w-4 mr-1" />
        PNG
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('svg')}
        title="Export as SVG"
      >
        <Download className="h-4 w-4 mr-1" />
        SVG
      </Button>
    </div>
  )
}
