import { Outlet, Link, useLocation } from 'react-router-dom'
import { FolderOpen, Settings, Home, Tags, HelpCircle, Library } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { UpdateNotification } from './UpdateNotification'

export function Layout() {
  const location = useLocation()
  const [appVersion, setAppVersion] = useState<string>('')

  useEffect(() => {
    window.electron?.getVersion().then(setAppVersion).catch(() => {})
  }, [])

  const navItems = [
    { path: '/', icon: Home, label: 'Projects' },
    { path: '/library', icon: Library, label: 'Document Library' },
    { path: '/keywords', icon: Tags, label: 'Keyword Lists' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/help', icon: HelpCircle, label: 'Help' },
  ]

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        {/* Logo/Title */}
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Document Lens</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Update notification */}
        <UpdateNotification />

        {/* Version */}
        <div className="p-4 border-t text-xs text-muted-foreground">
          Document Lens Desktop {appVersion ? `v${appVersion}` : ''}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
