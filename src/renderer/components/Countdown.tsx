import { useState, useEffect } from 'react'

interface CountdownProps {
  seconds: number
  onComplete: () => void
  onCancel: () => void
}

export function Countdown({ seconds, onComplete, onCancel }: CountdownProps) {
  const [count, setCount] = useState(seconds)

  useEffect(() => {
    if (count === 0) {
      onComplete()
      return
    }

    const timer = setTimeout(() => {
      setCount(count - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, onComplete])

  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-number">{count}</div>
        <button className="countdown-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
