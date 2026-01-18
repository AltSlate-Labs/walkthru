import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  src: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '--:--'
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Reset state when src changes
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => {
      // WebM from canvas.captureStream() often has Infinity duration
      // Workaround: seek to end to force browser to calculate real duration
      if (video.duration === Infinity || isNaN(video.duration)) {
        video.currentTime = 1e10 // Seek to large value
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          video.currentTime = 0 // Seek back to start
          if (isFinite(video.duration) && !isNaN(video.duration)) {
            setDuration(video.duration)
          }
        }
        video.addEventListener('seeked', onSeeked)
      } else {
        setDuration(video.duration)
      }
    }
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadedmetadata', handleDurationChange)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadedmetadata', handleDurationChange)
      video.removeEventListener('ended', handleEnded)
    }
  }, [src])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        className="video-element"
      />

      <div className="video-controls">
        <button className="play-pause-btn" onClick={togglePlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="timeline-container">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="timeline-slider"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          />
        </div>

        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  )
}
