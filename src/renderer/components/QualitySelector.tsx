import type { QualityPreset } from '../types/recording'

interface QualitySelectorProps {
  selected: QualityPreset
  onChange: (preset: QualityPreset) => void
}

export function QualitySelector({ selected, onChange }: QualitySelectorProps) {
  return (
    <div className="quality-selector">
      <span className="quality-label">Quality</span>
      <div className="quality-buttons">
        <button
          className={`quality-btn ${selected === 'low' ? 'active' : ''}`}
          onClick={() => onChange('low')}
        >
          720p · 15fps
        </button>
        <button
          className={`quality-btn ${selected === 'medium' ? 'active' : ''}`}
          onClick={() => onChange('medium')}
        >
          1080p · 30fps
        </button>
        <button
          className={`quality-btn ${selected === 'high' ? 'active' : ''}`}
          onClick={() => onChange('high')}
        >
          1080p · 60fps
        </button>
      </div>
    </div>
  )
}
