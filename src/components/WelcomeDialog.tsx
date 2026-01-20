import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Lightbulb, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/**
 * Welcome dialog shown to first-time users
 * Checks localStorage for 'hasSeenWelcome' flag
 */
export function WelcomeDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome dialog
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      setOpen(true)
      // Mark as seen
      localStorage.setItem('hasSeenWelcome', 'true')
    }
  }, [])

  const handleStartTour = () => {
    setOpen(false)
    // Navigate to first workflow example
    navigate('/')
    // Could add more tour logic here in future
  }

  const handleReadDocs = () => {
    setOpen(false)
    navigate('/help/user-guide')
  }

  const handleSkip = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Welcome to Document Lens
          </DialogTitle>
          <DialogDescription>
            Batch analysis of PDFs using TCFD, GRI, SDGs, and SASB frameworks
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Document Lens helps sustainability researchers analyze corporate reports at scale.
          </p>

          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Getting started:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-2">
              <li>✓ Create or import a project</li>
              <li>✓ Import PDF documents</li>
              <li>✓ Search keywords or run analysis</li>
              <li>✓ Compare collections and export findings</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleReadDocs}
            className="w-full"
            variant="default"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Read Documentation
          </Button>

          <Button
            onClick={handleStartTour}
            className="w-full"
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Exploring
          </Button>

          <button
            onClick={handleSkip}
            className="w-full text-xs text-muted-foreground hover:underline py-2"
          >
            Skip for now
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Access help anytime via the Help button in the sidebar
        </p>
      </DialogContent>
    </Dialog>
  )
}
