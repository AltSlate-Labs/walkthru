import { useState, useEffect, useCallback } from 'react'

export interface Recording {
  id: string
  filename: string
  filepath: string
  date: number
  size: number
}

interface UseRecordingsReturn {
  recordings: Recording[]
  isLoading: boolean
  error: string | null
  refreshRecordings: () => Promise<void>
  deleteRecording: (filepath: string) => Promise<boolean>
  exportRecording: (filepath: string) => Promise<boolean>
}

export function useRecordings(): UseRecordingsReturn {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRecordings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await window.electronAPI.invoke('list-recordings') as Recording[]
      setRecordings(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recordings'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteRecording = useCallback(async (filepath: string): Promise<boolean> => {
    try {
      const result = await window.electronAPI.invoke('delete-recording', filepath) as { success: boolean; reason?: string }
      if (result.success) {
        await refreshRecordings()
        return true
      }
      setError(result.reason || 'Failed to delete recording')
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete recording'
      setError(message)
      return false
    }
  }, [refreshRecordings])

  const exportRecording = useCallback(async (filepath: string): Promise<boolean> => {
    try {
      const result = await window.electronAPI.invoke('export-recording', filepath) as { success: boolean; reason?: string }
      if (result.success) {
        return true
      }
      if (result.reason !== 'cancelled') {
        setError(result.reason || 'Failed to export recording')
      }
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export recording'
      setError(message)
      return false
    }
  }, [])

  // Load recordings on mount
  useEffect(() => {
    refreshRecordings()
  }, [refreshRecordings])

  return {
    recordings,
    isLoading,
    error,
    refreshRecordings,
    deleteRecording,
    exportRecording
  }
}
