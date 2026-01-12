/**
 * SaveToCollectionDialog Component
 *
 * Dialog for adding selected documents to an existing or new collection.
 */

import { useState, useEffect } from 'react'
import { FolderPlus, Folder, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  getProjectCollections,
  createCollection,
  addDocumentsToCollection,
  type Collection,
} from '@/services/collections'

interface SaveToCollectionDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
  documentIds: string[]
  onSaved?: () => void
}

export function SaveToCollectionDialog({
  open,
  onClose,
  projectId,
  documentIds,
  onSaved,
}: SaveToCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    if (open) {
      loadCollections()
      setSelectedCollectionId(null)
      setCreateMode(false)
      setNewName('')
      setNewDescription('')
    }
  }, [open, projectId])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const result = await getProjectCollections(projectId)
      setCollections(result)
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      let collectionId = selectedCollectionId

      // Create new collection if in create mode
      if (createMode && newName.trim()) {
        collectionId = await createCollection(
          projectId,
          newName.trim(),
          newDescription.trim() || null,
          documentIds
        )
      } else if (collectionId) {
        // Add to existing collection
        await addDocumentsToCollection(collectionId, documentIds)
      } else {
        return // Nothing selected
      }

      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Failed to save to collection:', error)
      alert('Failed to save to collection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canSave =
    (createMode && newName.trim()) || (!createMode && selectedCollectionId)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Add to Collection
          </DialogTitle>
          <DialogDescription>
            {documentIds.length} document{documentIds.length !== 1 ? 's' : ''} selected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle between existing and new */}
          <div className="flex gap-2">
            <Button
              variant={!createMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode(false)}
            >
              Existing Collection
            </Button>
            <Button
              variant={createMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCreateMode(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </div>

          {createMode ? (
            /* Create new collection form */
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Collection name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  placeholder="Brief description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* Select existing collection */
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No collections yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setCreateMode(true)}
                    className="mt-2"
                  >
                    Create your first collection
                  </Button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedCollectionId(col.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedCollectionId === col.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <Folder
                        className={`h-5 w-5 shrink-0 ${
                          selectedCollectionId === col.id
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{col.name}</div>
                        {col.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {col.description}
                          </div>
                        )}
                      </div>
                      {selectedCollectionId === col.id && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Add to Collection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
