import { useState, useCallback } from 'react'

export interface Source {
  id: string
  name: string
  thumbnail: string | null
  appIcon: string | null
  type: 'screen' | 'window'
}

interface UseSourcePickerReturn {
  sources: Source[]
  screens: Source[]
  windows: Source[]
  isLoading: boolean
  error: string | null
  hasPermission: boolean | null
  refreshSources: () => Promise<void>
  setRecordingSource: (sourceId: string) => Promise<boolean>
}

export function useSourcePicker(): UseSourcePickerReturn {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const refreshSources = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const permission = await window.electronAPI.invoke('check-screen-permission') as boolean
      setHasPermission(permission)

      // Even if permission is false, we try to get sources (Electron might return empty windows)
      const result = await window.electronAPI.invoke('get-desktop-sources') as Source[]
      setSources(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sources'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setRecordingSource = useCallback(async (sourceId: string): Promise<boolean> => {
    try {
      const result = await window.electronAPI.invoke('set-recording-source', sourceId) as { success: boolean }
      return result.success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set recording source'
      setError(message)
      return false
    }
  }, [])

  const screens = sources.filter(s => s.type === 'screen')
  const windows = sources.filter(s => s.type === 'window')

  return {
    sources,
    screens,
    windows,
    isLoading,
    error,
    hasPermission,
    refreshSources,
    setRecordingSource
  }
}
