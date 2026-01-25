import { useCallback } from 'react'
import type { CameraShape } from '../hooks/useCanvasCompositor'

interface WebcamPreviewProps {
  stream: MediaStream | null
  isVisible: boolean
  cameraShape: CameraShape
}

export function WebcamPreview({ stream, isVisible, cameraShape }: WebcamPreviewProps) {
  // Use callback ref to set srcObject immediately when video element is created
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (video && stream) {
      video.srcObject = stream
      video.play().catch(console.error)
    }
  }, [stream])

  if (!isVisible || !stream) {
    return null
  }

  return (
    <div className={`webcam-preview shape-${cameraShape}`}>
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
      />
    </div>
  )
}
