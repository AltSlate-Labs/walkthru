import { useState, useRef, useCallback, useEffect } from 'react'

interface UseWebcamReturn {
  isEnabled: boolean
  stream: MediaStream | null
  error: string | null
  enableWebcam: () => Promise<void>
  disableWebcam: () => void
  toggleWebcam: () => Promise<void>
}

export function useWebcam(): UseWebcamReturn {
  const [isEnabled, setIsEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const disableWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsEnabled(false)
    setError(null)
  }, [])

  const enableWebcam = useCallback(async () => {
    try {
      setError(null)

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: false
      })

      streamRef.current = webcamStream
      setStream(webcamStream)
      setIsEnabled(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access webcam'
      setError(message)
      setIsEnabled(false)
    }
  }, [])

  const toggleWebcam = useCallback(async () => {
    if (isEnabled) {
      disableWebcam()
    } else {
      await enableWebcam()
    }
  }, [isEnabled, enableWebcam, disableWebcam])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    isEnabled,
    stream,
    error,
    enableWebcam,
    disableWebcam,
    toggleWebcam
  }
}
