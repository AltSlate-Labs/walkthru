import { useCallback } from 'react'

interface WebcamPreviewProps {
  stream: MediaStream | null
  isVisible: boolean
}

export function WebcamPreview({ stream, isVisible }: WebcamPreviewProps) {
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
    <div className="webcam-preview">
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
      />
    </div>
  )
}
