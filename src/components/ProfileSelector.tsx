/**
 * ProfileSelector Component
 *
 * Dropdown component for selecting and managing analysis profiles.
 * Shows the active profile and allows quick switching between profiles.
 */

import { useState, useEffect } from 'react'
import { Settings2, Check, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getProjectProfiles,
  getActiveProfile,
  setActiveProfile,
  clearActiveProfile,
  type AnalysisProfile,
  type ParsedAnalysisProfile,
} from '@/services/profiles'

interface ProfileSelectorProps {
  projectId: string
  onManageProfiles?: () => void
  onProfileChange?: (profile: ParsedAnalysisProfile | null) => void
}

export function ProfileSelector({
  projectId,
  onManageProfiles,
  onProfileChange,
}: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<AnalysisProfile[]>([])
  const [activeProfile, setActiveProfileState] = useState<ParsedAnalysisProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [projectId])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const [allProfiles, active] = await Promise.all([
        getProjectProfiles(projectId),
        getActiveProfile(projectId),
      ])
      setProfiles(allProfiles)
      setActiveProfileState(active)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProfile = async (profileId: string) => {
    try {
      await setActiveProfile(projectId, profileId)
      const active = await getActiveProfile(projectId)
      setActiveProfileState(active)
      onProfileChange?.(active)
    } catch (error) {
      console.error('Failed to set active profile:', error)
    }
  }

  const handleClearProfile = async () => {
    try {
      await clearActiveProfile(projectId)
      setActiveProfileState(null)
      onProfileChange?.(null)
    } catch (error) {
      console.error('Failed to clear profile:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="max-w-[120px] truncate">
            {loading
              ? 'Loading...'
              : activeProfile?.name || 'No Profile'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {profiles.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            No profiles yet
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onClick={handleClearProfile}
              className={!activeProfile ? 'bg-muted' : ''}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 flex items-center justify-center">
                  {!activeProfile && <Check className="h-4 w-4" />}
                </div>
                <span className="text-muted-foreground">No Profile</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {profiles.map((profile) => (
              <DropdownMenuItem
                key={profile.id}
                onClick={() => handleSelectProfile(profile.id)}
                className={activeProfile?.id === profile.id ? 'bg-muted' : ''}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {activeProfile?.id === profile.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{profile.name}</div>
                    {profile.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {profile.description}
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onManageProfiles}>
          <Plus className="h-4 w-4 mr-2" />
          Manage Profiles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
