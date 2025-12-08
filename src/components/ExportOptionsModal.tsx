import { useState } from 'react'
import { Download, Loader2, FileText, FileSpreadsheet, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  exportProjectSummary,
  exportFullProject,
  type ExportFormat,
  type ProjectExportOptions,
} from '@/services/export'

interface ExportOptionsModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
  documentCount: number
}

type ExportType = 'summary' | 'full'

export function ExportOptionsModal({
  open,
  onClose,
  projectId,
  projectName,
  documentCount,
}: ExportOptionsModalProps) {
  const [exportType, setExportType] = useState<ExportType>('summary')
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [exporting, setExporting] = useState(false)

  // Full export options
  const [includeDocumentSummary, setIncludeDocumentSummary] = useState(true)
  const [includeDocumentText, setIncludeDocumentText] = useState(false)
  const [includeAnalysisResults, setIncludeAnalysisResults] = useState(true)
  const [includeKeywordResults, setIncludeKeywordResults] = useState(true)
  const [includeNgramResults, setIncludeNgramResults] = useState(true)

  const handleExport = async () => {
    setExporting(true)

    try {
      if (exportType === 'summary') {
        await exportProjectSummary(
          projectId,
          projectName,
          format as 'csv' | 'xlsx'
        )
      } else {
        const options: ProjectExportOptions = {
          includeDocumentSummary,
          includeDocumentText,
          includeAnalysisResults,
          includeKeywordResults,
          includeNgramResults,
          format,
        }
        await exportFullProject(projectId, projectName, options)
      }
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Export Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType('summary')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  exportType === 'summary'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <FileSpreadsheet className="h-6 w-6 mb-2 text-primary" />
                <div className="font-medium">Summary</div>
                <div className="text-xs text-muted-foreground">
                  Document metadata & metrics
                </div>
              </button>
              <button
                onClick={() => setExportType('full')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  exportType === 'full'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <Archive className="h-6 w-6 mb-2 text-primary" />
                <div className="font-medium">Full Export</div>
                <div className="text-xs text-muted-foreground">
                  ZIP with all project data
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Format</label>
            <div className="flex gap-2">
              {exportType === 'summary' ? (
                <>
                  <Button
                    variant={format === 'xlsx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('xlsx')}
                  >
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant={format === 'csv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('csv')}
                  >
                    CSV
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={format === 'xlsx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('xlsx')}
                  >
                    Excel files
                  </Button>
                  <Button
                    variant={format === 'csv' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('csv')}
                  >
                    CSV files
                  </Button>
                  <Button
                    variant={format === 'json' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormat('json')}
                  >
                    JSON
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Full Export Options */}
          {exportType === 'full' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Include in ZIP</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeDocumentSummary}
                    onCheckedChange={(checked) =>
                      setIncludeDocumentSummary(checked === true)
                    }
                  />
                  Project summary spreadsheet
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeAnalysisResults}
                    onCheckedChange={(checked) =>
                      setIncludeAnalysisResults(checked === true)
                    }
                  />
                  Analysis results (readability, writing quality)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeDocumentText}
                    onCheckedChange={(checked) =>
                      setIncludeDocumentText(checked === true)
                    }
                  />
                  Extracted text (larger file size)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeKeywordResults}
                    onCheckedChange={(checked) =>
                      setIncludeKeywordResults(checked === true)
                    }
                  />
                  Keyword search results
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={includeNgramResults}
                    onCheckedChange={(checked) =>
                      setIncludeNgramResults(checked === true)
                    }
                  />
                  N-gram analysis results
                </label>
              </div>
            </div>
          )}

          {/* Summary info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {documentCount} document{documentCount !== 1 ? 's' : ''} will be
                exported
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
