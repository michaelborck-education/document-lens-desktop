import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const HELP_SECTIONS = [
  { id: 'user-guide', title: 'User Guide', icon: '📖' },
  { id: 'analysis-workflows', title: 'Analysis Workflows', icon: '🔍' },
  { id: 'quick-reference', title: 'Quick Reference', icon: '⚡' },
  { id: 'collaboration', title: 'Collaboration', icon: '👥' },
]

export function Help() {
  const { section = 'user-guide' } = useParams<{ section?: string }>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    setContent('')

    // Load markdown file from public/docs directory
    fetch(`/docs/${section}.md`)
      .then(response => {
        if (!response.ok) throw new Error('File not found')
        return response.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to load help content:', error)
        setContent('# Help Not Found\n\nSorry, this help section could not be loaded.')
        setLoading(false)
      })
  }, [section])

  // Simple search highlighting in future - for now just show all content
  const displayContent = content

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted border-b px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Help & Documentation</h1>
        </div>

        {/* Search (placeholder for future implementation) */}
        <div className="flex items-center gap-2 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
            disabled
          />
          <span className="text-xs text-muted-foreground">(Coming soon)</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-muted border-r min-h-screen p-4 sticky top-16">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-4">
              Documentation
            </p>
            {HELP_SECTIONS.map(s => {
              const isActive = section === s.id
              return (
                <Link
                  key={s.id}
                  to={`/help/${s.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-background text-foreground'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.title}</span>
                </Link>
              )
            })}
          </div>

          {/* Help Info */}
          <div className="mt-8 p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Use the breadcrumbs at the top to navigate back to the main app.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 max-w-4xl">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl font-bold mt-8 mb-3" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl font-semibold mt-6 mb-2" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-muted-foreground leading-relaxed mb-3" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside space-y-1 my-3 text-muted-foreground" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside space-y-1 my-3 text-muted-foreground" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="ml-2" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3" {...props} />
                  ),
                  code: ({ node, inline, ...props }) => {
                    if (inline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props} />
                      )
                    }
                    return <code {...props} />
                  },
                  pre: ({ node, ...props }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-auto my-3" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full border-collapse border border-muted" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-muted px-3 py-2 bg-muted text-left font-semibold" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-muted px-3 py-2" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a className="text-primary hover:underline" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-6 border-muted" {...props} />
                  ),
                  img: ({ node, ...props }) => (
                    <img className="max-w-full h-auto rounded-lg my-3" {...props} />
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Navigation Between Sections */}
          <div className="mt-12 pt-6 border-t space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>More documentation:</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {HELP_SECTIONS.map(s => {
                const isCurrent = section === s.id
                return (
                  <Link key={s.id} to={`/help/${s.id}`}>
                    <Button
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                    >
                      {s.icon} {s.title}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
