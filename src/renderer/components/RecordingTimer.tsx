import { useState, useEffect } from 'react'

interface RecordingTimerProps {
  isRunning: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function RecordingTimer({ isRunning }: RecordingTimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="recording-timer">
      {formatTime(seconds)}
    </div>
  )
}
