import { useState, useRef, useCallback } from 'react'
import { useCanvasCompositor, type CompositorOptions } from './useCanvasCompositor'

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

export interface RecordingOptions {
  audio: boolean
  webcamStream?: MediaStream | null
}

interface UseRecorderReturn {
  state: RecordingState
  recordedBlob: Blob | null
  startRecording: (options?: RecordingOptions) => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  error: string | null
}

export function useRecorder(compositorOptions?: Partial<CompositorOptions>): UseRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamsRef = useRef<MediaStream[]>([])

  const { startCompositing, stopCompositing } = useCanvasCompositor(compositorOptions)

  const cleanupStreams = useCallback(() => {
    stopCompositing()
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop())
    })
    streamsRef.current = []
  }, [stopCompositing])

  const startRecording = useCallback(async (options: RecordingOptions = { audio: false }) => {
    try {
      setError(null)
      setRecordedBlob(null)
      chunksRef.current = []
      cleanupStreams()

      // Use standard getDisplayMedia - Electron's setDisplayMediaRequestHandler will handle it
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      streamsRef.current.push(displayStream)

      // Get the video stream - either composite (with webcam) or raw display stream
      let videoStream: MediaStream
      if (options.webcamStream) {
        // Use canvas compositor to merge screen and webcam
        videoStream = startCompositing(displayStream, options.webcamStream)
      } else {
        videoStream = displayStream
      }

      // Combine tracks
      const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()]

      // Request microphone if enabled
      if (options.audio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          })
          streamsRef.current.push(audioStream)
          tracks.push(...audioStream.getAudioTracks())
        } catch (audioErr) {
          console.warn('Could not access microphone:', audioErr)
        }
      }

      const combinedStream = new MediaStream(tracks)

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        setState('stopped')
        cleanupStreams()
      }

      // Handle user stopping share via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }

      mediaRecorder.start(1000)
      setState('recording')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      setError(message)
      setState('idle')
      cleanupStreams()
    }
  }, [cleanupStreams, startCompositing])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
    }
  }, [])

  return {
    state,
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error
  }
}
