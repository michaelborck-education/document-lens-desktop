import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, BarChart3, Search, Trash2, Loader2, Hash, PieChart, Download, Package, Library, FolderMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DocumentTable } from '@/components/DocumentTable'
import { DocumentMetadataModal } from '@/components/DocumentMetadataModal'
import { ImportProgressDialog } from '@/components/ImportProgressDialog'
import { ExportOptionsModal } from '@/components/ExportOptionsModal'
import { ProfileSelector } from '@/components/ProfileSelector'
import { ProfileEditor } from '@/components/ProfileEditor'
import { ImportBundleDialog } from '@/components/ImportBundleDialog'
import { AddFromLibraryDialog } from '@/components/AddFromLibraryDialog'
import { HelpButton } from '@/components/HelpButton'
import {
  importDocuments,
  deleteDocuments,
  removeDocumentFromProject,
  getProjectDocuments,
  type DocumentRecord,
  type ImportProgress,
  type ImportResult,
} from '@/services/documents'
import {
  analyzeDocuments,
  type AnalysisProgress,
} from '@/services/analysis'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)
  
  // Import state
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null)
  
  // Modal state
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showImportBundle, setShowImportBundle] = useState(false)
  const [showAddFromLibrary, setShowAddFromLibrary] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProject()
      loadDocuments()
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      const result = await window.electron.dbQuery<Project>(
        'SELECT * FROM projects WHERE id = ?',
        [projectId]
      )
      if (result.length > 0) {
        setProject(result[0])
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const result = await getProjectDocuments(projectId!)
      setDocuments(result)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFiles = async (filePaths?: string[]) => {
    try {
      let paths = filePaths
      
      if (!paths) {
        const result = await window.electron.openFileDialog({
          title: 'Select PDF files to import',
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
        })

        if (result.canceled || result.filePaths.length === 0) {
          return
        }
        paths = result.filePaths
      }

      setImporting(true)
      setImportResults([])
      setImportProgress({
        total: paths.length,
        current: 0,
        currentFile: '',
        status: 'pending',
      })

      const results = await importDocuments(projectId!, paths, setImportProgress)
      setImportResults(results)
      
      // Reload documents after import
      loadDocuments()
      
      // Auto-close dialog after 3 seconds if all successful
      const allSuccess = results.every((r) => r.success)
      if (allSuccess) {
        setTimeout(() => {
          setImporting(false)
          setImportProgress(null)
          setImportResults([])
        }, 2000)
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportProgress({
        total: 0,
        current: 0,
        currentFile: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleRemoveFromProject = async (documentIds: string[]) => {
    const count = documentIds.length
    const message = count === 1
      ? 'Remove this document from the project?\n\nThe document will remain in your library and can be added to other projects.'
      : `Remove ${count} documents from the project?\n\nThey will remain in your library and can be added to other projects.`

    if (!confirm(message)) {
      return
    }

    try {
      for (const docId of documentIds) {
        await removeDocumentFromProject(docId, projectId!)
      }
      setSelectedIds(new Set())
      loadDocuments()
    } catch (error) {
      console.error('Failed to remove documents:', error)
    }
  }

  const handleDeleteDocuments = async (documentIds: string[]) => {
    const count = documentIds.length
    const message = count === 1
      ? 'Permanently delete this document from the library?\n\nThis will remove it from ALL projects and cannot be undone.'
      : `Permanently delete ${count} documents from the library?\n\nThis will remove them from ALL projects and cannot be undone.`

    if (!confirm(message)) {
      return
    }

    try {
      await deleteDocuments(documentIds)
      setSelectedIds(new Set())
      loadDocuments()
    } catch (error) {
      console.error('Failed to delete documents:', error)
    }
  }

  const handleOpenFile = async (document: DocumentRecord) => {
    try {
      await window.electron.openPath(document.file_path)
    } catch (error) {
      console.error('Failed to open file:', error)
    }
  }

  const handleAnalyzeAll = async () => {
    // Get documents that need analysis (have text but not completed)
    const docsToAnalyze = documents.filter(
      d => d.extracted_text && d.analysis_status !== 'completed'
    )

    if (docsToAnalyze.length === 0) {
      alert('All documents are already analyzed or have no text to analyze.')
      return
    }

    setAnalyzing(true)
    setAnalysisProgress({
      total: docsToAnalyze.length,
      current: 0,
      currentDocument: '',
      status: 'pending',
    })

    try {
      const result = await analyzeDocuments(docsToAnalyze, setAnalysisProgress)
      
      // Show completion message
      if (result.failed > 0) {
        alert(`Analysis complete: ${result.success} succeeded, ${result.failed} failed`)
      }
      
      // Reload documents to show updated status
      loadDocuments()
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
      setAnalysisProgress(null)
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFiles = files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    
    if (pdfFiles.length > 0) {
      // Note: In Electron, we can get the file path from the File object
      const filePaths = pdfFiles.map((f) => (f as any).path).filter(Boolean)
      if (filePaths.length > 0) {
        handleImportFiles(filePaths)
      }
    }
  }, [projectId])

  if (!project) {
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
    <div 
      className="p-8 min-h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-xl font-medium text-primary">Drop PDF files here</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <ProfileSelector
          projectId={projectId!}
          onManageProfiles={() => setShowProfileEditor(true)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.analysis_status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.analysis_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(documents.map((d) => d.company_name).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={() => handleImportFiles()}>
          <Upload className="h-4 w-4 mr-2" />
          Import PDFs
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddFromLibrary(true)}
        >
          <Library className="h-4 w-4 mr-2" />
          Add from Library
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowImportBundle(true)}
        >
          <Package className="h-4 w-4 mr-2" />
          Import Bundle
        </Button>
        <Button
          variant="outline"
          disabled={documents.length === 0 || analyzing}
          onClick={handleAnalyzeAll}
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4 mr-2" />
          )}
          {analyzing ? 'Analyzing...' : 'Analyze All'}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            disabled={documents.length === 0}
            onClick={() => navigate(`/project/${projectId}/search`)}
          >
            <Search className="h-4 w-4 mr-2" />
            Keyword Search
          </Button>
          <HelpButton section="user-guide" tooltip="Learn about keyword search" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            disabled={documents.length === 0}
            onClick={() => navigate(`/project/${projectId}/ngrams`)}
          >
            <Hash className="h-4 w-4 mr-2" />
            N-gram Analysis
          </Button>
          <HelpButton section="analysis-workflows" tooltip="Learn about N-gram analysis" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            disabled={documents.length === 0}
            onClick={() => navigate(`/project/${projectId}/visualize`)}
          >
            <PieChart className="h-4 w-4 mr-2" />
            Visualizations
          </Button>
          <HelpButton section="user-guide" tooltip="Learn about visualizations" />
        </div>
        <Button
          variant="outline"
          disabled={documents.length === 0}
          onClick={() => setShowExportModal(true)}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {/* Selection-based actions */}
        {selectedIds.size > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => handleRemoveFromProject(Array.from(selectedIds))}
            >
              <FolderMinus className="h-4 w-4 mr-2" />
              Remove from Project ({selectedIds.size})
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteDocuments(Array.from(selectedIds))}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete from Library ({selectedIds.size})
            </Button>
          </>
        )}
      </div>

      {/* Analysis Progress */}
      {analyzing && analysisProgress && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Analyzing: {analysisProgress.currentDocument}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analysisProgress.current} of {analysisProgress.total} documents
                </p>
              </div>
            </div>
            <Progress 
              value={(analysisProgress.current / analysisProgress.total) * 100} 
              className="h-2" 
            />
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div 
              className="text-center py-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleImportFiles()}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-medium mb-2">No documents yet</h2>
              <p className="text-muted-foreground mb-4">
                Drag and drop PDF files here, or click to browse
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import PDFs
              </Button>
            </div>
          ) : (
            <DocumentTable
              documents={documents}
              projectId={projectId!}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={setEditingDocument}
              onDelete={handleDeleteDocuments}
              onRemoveFromProject={handleRemoveFromProject}
              onOpenFile={handleOpenFile}
            />
          )}
        </CardContent>
      </Card>

      {/* Import Progress Dialog */}
      <ImportProgressDialog
        open={importing}
        progress={importProgress}
        results={importResults}
        onClose={() => setImporting(false)}
      />

      {/* Document Metadata Modal */}
      <DocumentMetadataModal
        open={editingDocument !== null}
        onClose={() => setEditingDocument(null)}
        document={editingDocument}
        onSaved={loadDocuments}
      />

      {/* Export Options Modal */}
      <ExportOptionsModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        projectId={projectId!}
        projectName={project?.name || 'project'}
        documentCount={documents.length}
      />

      {/* Profile Editor Modal */}
      <ProfileEditor
        open={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        projectId={projectId!}
      />

      {/* Import Bundle Dialog */}
      <ImportBundleDialog
        open={showImportBundle}
        onClose={() => setShowImportBundle(false)}
        projectId={projectId!}
        onImported={loadDocuments}
      />

      {/* Add From Library Dialog */}
      <AddFromLibraryDialog
        open={showAddFromLibrary}
        onClose={() => setShowAddFromLibrary(false)}
        projectId={projectId!}
        onAdded={loadDocuments}
      />
    </div>
  )
}
