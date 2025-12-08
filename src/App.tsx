import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { ProjectList } from './pages/ProjectList'
import { ProjectDashboard } from './pages/ProjectDashboard'
import { DocumentView } from './pages/DocumentView'
import { KeywordSearch } from './pages/KeywordSearch'
import { NgramAnalysis } from './pages/NgramAnalysis'
import { KeywordLists } from './pages/KeywordLists'
import { Settings } from './pages/Settings'
import { api } from './services/api'
import { seedFrameworkKeywords } from './services/keywords'

function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    // Initialize app
    initializeApp()
    checkBackendStatus()
    // Check status periodically
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const initializeApp = async () => {
    try {
      // Seed framework keywords if not already done
      await seedFrameworkKeywords()
    } catch (error) {
      console.error('Failed to initialize app:', error)
    }
  }

  const checkBackendStatus = async () => {
    try {
      await api.healthCheck()
      setBackendStatus('online')
    } catch {
      setBackendStatus('offline')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {backendStatus === 'offline' && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm text-center">
          Backend offline - some features may be unavailable. 
          <button 
            onClick={checkBackendStatus}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectList />} />
          <Route path="project/:projectId" element={<ProjectDashboard />} />
          <Route path="project/:projectId/document/:documentId" element={<DocumentView />} />
          <Route path="project/:projectId/search" element={<KeywordSearch />} />
          <Route path="project/:projectId/ngrams" element={<NgramAnalysis />} />
          <Route path="keywords" element={<KeywordLists />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
