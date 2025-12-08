import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { api } from '@/services/api'

export function Settings() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000')
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    loadSettings()
    loadAppVersion()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await window.electron.dbQuery<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'backend_url'"
      )
      if (result.length > 0) {
        setBackendUrl(result[0].value)
        api.setBaseUrl(result[0].value)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadAppVersion = async () => {
    try {
      const version = await window.electron.getVersion()
      setAppVersion(version)
    } catch (error) {
      console.error('Failed to get app version:', error)
    }
  }

  const saveBackendUrl = async () => {
    try {
      await window.electron.dbRun(
        "UPDATE settings SET value = ? WHERE key = 'backend_url'",
        [backendUrl]
      )
      api.setBaseUrl(backendUrl)
    } catch (error) {
      console.error('Failed to save backend URL:', error)
    }
  }

  const testConnection = async () => {
    setTestStatus('testing')
    try {
      await api.healthCheck()
      setTestStatus('success')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch (error) {
      setTestStatus('error')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Backend Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Backend Configuration</CardTitle>
          <CardDescription>
            Configure the connection to the document-lens API backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Backend URL</label>
            <div className="flex gap-2 mt-1">
              <Input
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
              <Button onClick={saveBackendUrl} variant="outline">
                Save
              </Button>
            </div>
          </div>
          <div>
            <Button
              onClick={testConnection}
              disabled={testStatus === 'testing'}
              variant={
                testStatus === 'success'
                  ? 'default'
                  : testStatus === 'error'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {testStatus === 'testing'
                ? 'Testing...'
                : testStatus === 'success'
                ? 'Connected!'
                : testStatus === 'error'
                ? 'Connection Failed'
                : 'Test Connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your local database and cached data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Database Location</div>
              <div className="text-sm text-muted-foreground">
                ~/Library/Application Support/document-lens-desktop/document-lens.db
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button variant="destructive" disabled>
              Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will delete all projects, documents, and analysis results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>{appVersion || '0.1.0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Backend</span>
            <a
              href="https://github.com/michaelborck-education/document-lens"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.electron.openExternal('https://github.com/michaelborck-education/document-lens')
              }}
            >
              document-lens
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">License</span>
            <span>MIT</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
