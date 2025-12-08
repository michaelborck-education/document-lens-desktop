import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { DocumentRecord } from '@/services/documents'

type SortField = 'filename' | 'company_name' | 'report_year' | 'analysis_status' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface DocumentTableProps {
  documents: DocumentRecord[]
  projectId: string
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onEdit: (document: DocumentRecord) => void
  onDelete: (documentIds: string[]) => void
  onOpenFile: (document: DocumentRecord) => void
}

export function DocumentTable({
  documents,
  projectId,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onOpenFile,
}: DocumentTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [contextMenu, setContextMenu] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    let aVal: string | number | null = a[sortField]
    let bVal: string | number | null = b[sortField]

    // Handle null values
    if (aVal === null) aVal = ''
    if (bVal === null) bVal = ''

    // Compare
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }

    return 0
  })

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(documents.map((d) => d.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    onSelectionChange(newSelection)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      analyzing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    }
    return styles[status] || styles.pending
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-10 px-3 py-3">
              <Checkbox
                checked={selectedIds.size === documents.length && documents.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </th>
            <th className="text-left px-3 py-3">
              <button
                className="flex items-center gap-1 text-sm font-medium hover:text-primary"
                onClick={() => handleSort('filename')}
              >
                Document
                <SortIcon field="filename" />
              </button>
            </th>
            <th className="text-left px-3 py-3">
              <button
                className="flex items-center gap-1 text-sm font-medium hover:text-primary"
                onClick={() => handleSort('company_name')}
              >
                Company
                <SortIcon field="company_name" />
              </button>
            </th>
            <th className="text-left px-3 py-3 w-24">
              <button
                className="flex items-center gap-1 text-sm font-medium hover:text-primary"
                onClick={() => handleSort('report_year')}
              >
                Year
                <SortIcon field="report_year" />
              </button>
            </th>
            <th className="text-left px-3 py-3 w-28">
              <button
                className="flex items-center gap-1 text-sm font-medium hover:text-primary"
                onClick={() => handleSort('analysis_status')}
              >
                Status
                <SortIcon field="analysis_status" />
              </button>
            </th>
            <th className="w-20 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {sortedDocuments.map((doc) => (
            <tr
              key={doc.id}
              className="border-t hover:bg-muted/30 transition-colors"
            >
              <td className="px-3 py-3">
                <Checkbox
                  checked={selectedIds.has(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
              </td>
              <td className="px-3 py-3">
                <Link
                  to={`/project/${projectId}/document/${doc.id}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[300px] hover:underline" title={doc.filename}>
                    {doc.filename}
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3">
                <span className="text-sm text-muted-foreground">
                  {doc.company_name || '-'}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-sm text-muted-foreground">
                  {doc.report_year || '-'}
                </span>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(doc.analysis_status)}`}
                >
                  {doc.analysis_status}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setContextMenu(contextMenu === doc.id ? null : doc.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {contextMenu === doc.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setContextMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-popover border rounded-md shadow-lg py-1">
                        <Link
                          to={`/project/${projectId}/document/${doc.id}`}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => setContextMenu(null)}
                        >
                          <Eye className="h-4 w-4" />
                          View Document
                        </Link>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            onEdit(doc)
                            setContextMenu(null)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Metadata
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            onOpenFile(doc)
                            setContextMenu(null)
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open PDF
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-muted"
                          onClick={() => {
                            onDelete([doc.id])
                            setContextMenu(null)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
