import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, BarChart3, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  filename: string
  file_path: string
  analysis_status: string
  report_year: number | null
  company_name: string | null
  created_at: string
}

export function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

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
      const result = await window.electron.dbQuery<Document>(
        'SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      )
      setDocuments(result)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFiles = async () => {
    try {
      const result = await window.electron.openFileDialog({
        title: 'Select PDF files to import',
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return
      }

      // TODO: Process and import files
      console.log('Selected files:', result.filePaths)
      alert(`Selected ${result.filePaths.length} file(s). Import functionality coming in Phase 2.2!`)
    } catch (error) {
      console.error('Failed to open file dialog:', error)
    }
  }

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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
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
      <div className="flex gap-2 mb-6">
        <Button onClick={handleImportFiles}>
          <Upload className="h-4 w-4 mr-2" />
          Import PDFs
        </Button>
        <Button variant="outline" disabled={documents.length === 0}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Analyze All
        </Button>
        <Button variant="outline" disabled={documents.length === 0}>
          <Search className="h-4 w-4 mr-2" />
          Keyword Search
        </Button>
      </div>

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
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-medium mb-2">No documents yet</h2>
              <p className="text-muted-foreground mb-4">
                Import PDF files to start analyzing
              </p>
              <Button onClick={handleImportFiles}>
                <Upload className="h-4 w-4 mr-2" />
                Import PDFs
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{doc.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.company_name || 'Unknown Company'}
                        {doc.report_year && ` - ${doc.report_year}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        doc.analysis_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : doc.analysis_status === 'analyzing'
                          ? 'bg-blue-100 text-blue-800'
                          : doc.analysis_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {doc.analysis_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
