/**
 * CollectionManager Component
 *
 * Manages virtual collections within a project - create, edit, delete, view collections.
 * Can be used as a dialog or embedded in a page.
 */

import { useState, useEffect } from 'react'
import { FolderPlus, Folder, MoreVertical, Trash2, Edit2, Copy, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getProjectCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  duplicateCollection,
  getCollectionDocumentCount,
  type Collection,
} from '@/services/collections'

interface CollectionManagerProps {
  open: boolean
  onClose: () => void
  projectId: string
  onCollectionSelect?: (collectionId: string) => void
}

interface CollectionWithCount extends Collection {
  document_count: number
}

export function CollectionManager({
  open,
  onClose,
  projectId,
  onCollectionSelect,
}: CollectionManagerProps) {
  const [collections, setCollections] = useState<CollectionWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (open) {
      loadCollections()
    }
  }, [open, projectId])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const result = await getProjectCollections(projectId)

      // Get document counts for each collection
      const collectionsWithCounts = await Promise.all(
        result.map(async (col) => {
          const count = await getCollectionDocumentCount(col.id)
          return { ...col, document_count: count }
        })
      )

      setCollections(collectionsWithCounts)
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return

    try {
      setCreating(true)
      await createCollection(projectId, newName.trim(), newDescription.trim() || null)
      setNewName('')
      setNewDescription('')
      loadCollections()
    } catch (error) {
      console.error('Failed to create collection:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return

    try {
      await updateCollection(id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      })
      setEditingId(null)
      loadCollections()
    } catch (error) {
      console.error('Failed to update collection:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Documents will not be deleted.')) return

    try {
      await deleteCollection(id)
      loadCollections()
    } catch (error) {
      console.error('Failed to delete collection:', error)
    }
  }

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await duplicateCollection(id, `${name} (Copy)`)
      loadCollections()
    } catch (error) {
      console.error('Failed to duplicate collection:', error)
    }
  }

  const startEditing = (col: CollectionWithCount) => {
    setEditingId(col.id)
    setEditName(col.name)
    setEditDescription(col.description || '')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Collections
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Create new collection */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">New Collection</span>
            </div>
            <Input
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-2" />
              )}
              Create
            </Button>
          </div>

          {/* Collections list */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No collections yet</p>
              <p className="text-sm">Create a collection to organize your documents</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  {editingId === col.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <Input
                        placeholder="Description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(col.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Folder className="h-5 w-5 text-primary shrink-0" />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onCollectionSelect?.(col.id)}
                      >
                        <div className="font-medium truncate">{col.name}</div>
                        {col.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {col.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <FileText className="h-3 w-3" />
                          <span>
                            {col.document_count} document{col.document_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditing(col)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(col.id, col.name)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(col.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
