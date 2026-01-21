import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Lightbulb, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/**
 * Welcome dialog shown on startup unless user has disabled it
 * Controlled by 'showWelcomeDialog' in localStorage
 */
export function WelcomeDialog() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Check if user has disabled welcome dialog
    const showWelcome = localStorage.getItem('showWelcomeDialog')
    // Show dialog unless explicitly set to 'false'
    if (showWelcome !== 'false') {
      setOpen(true)
    }
  }, [])

  const handleClose = () => {
    // Save preference if "Don't show again" is checked
    if (dontShowAgain) {
      localStorage.setItem('showWelcomeDialog', 'false')
    }
    setOpen(false)
  }

  const handleStartTour = () => {
    handleClose()
    // Navigate to first workflow example
    navigate('/')
  }

  const handleReadDocs = () => {
    handleClose()
    navigate('/help/user-guide')
  }

  const handleSkip = () => {
    handleClose()
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

        <div className="flex items-center gap-2 pt-2 border-t">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label
            htmlFor="dontShowAgain"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Don't show this again
          </label>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Access help anytime via the Help button in the sidebar.
          You can re-enable this dialog in Settings.
        </p>
      </DialogContent>
    </Dialog>
  )
}
