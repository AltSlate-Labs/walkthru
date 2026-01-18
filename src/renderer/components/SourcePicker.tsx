import { useState, useEffect } from 'react'
import { Source, useSourcePicker } from '../hooks/useSourcePicker'

interface SourcePickerProps {
  isOpen: boolean
  onSelect: (source: Source) => void
  onCancel: () => void
}

type TabType = 'screens' | 'windows'

interface SourceCardProps {
  source: Source
  isSelected: boolean
  onSelect: () => void
}

function SourceCard({ source, isSelected, onSelect }: SourceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Reset state when source changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [source.id])

  const showPlaceholder = !imageLoaded || imageError

  return (
    <div
      className={`source-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="source-thumbnail-container">
        {/* Always render placeholder, hide when image loads */}
        <div
          className="source-thumbnail-placeholder"
          style={{ display: showPlaceholder ? 'flex' : 'none' }}
        >
          <span className="placeholder-icon">
            {source.type === 'screen' ? '🖥️' : '🪟'}
          </span>
        </div>

        {/* Image loads behind placeholder, shown when ready */}
        {source.thumbnail && (
          <img
            src={source.thumbnail}
            alt={source.name}
            className="source-thumbnail"
            style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div className="source-info">
        {source.appIcon && (
          <img src={source.appIcon} alt="" className="source-icon" />
        )}
        <span className="source-name" title={source.name}>
          {source.name}
        </span>
      </div>
    </div>
  )
}



export function SourcePicker({ isOpen, onSelect, onCancel }: SourcePickerProps) {
  const { screens, windows, isLoading, refreshSources, hasPermission } = useSourcePicker()
  const [activeTab, setActiveTab] = useState<TabType>('screens')
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)

  // Refresh sources when picker opens
  useEffect(() => {
    if (isOpen) {
      refreshSources()
      setSelectedSource(null)
    }
  }, [isOpen, refreshSources])

  // Auto-select first screen if available
  useEffect(() => {
    if (screens.length > 0 && !selectedSource) {
      setSelectedSource(screens[0])
    }
  }, [screens, selectedSource])

  if (!isOpen) return null

  const currentSources = activeTab === 'screens' ? screens : windows

  const handleShare = () => {
    if (selectedSource) {
      onSelect(selectedSource)
    }
  }

  return (
    <div className="source-picker-overlay">
      <div className="source-picker">
        <div className="source-picker-header">
          <h2>Choose what to share</h2>
          {hasPermission === false && (
            <div className="permission-warning">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>Screen Recording permission required</strong>
                <p>Enable "Screen Recording" for this app in System Settings to see thumbnails.</p>
              </div>
            </div>
          )}
          <div className="source-tabs">
            <button
              className={`source-tab ${activeTab === 'screens' ? 'active' : ''}`}
              onClick={() => setActiveTab('screens')}
            >
              Screens ({screens.length})
            </button>
            <button
              className={`source-tab ${activeTab === 'windows' ? 'active' : ''}`}
              onClick={() => setActiveTab('windows')}
            >
              Windows ({windows.length})
            </button>
          </div>
        </div>

        <div className="source-grid">
          {isLoading && (
            <div className="source-loading">Loading sources...</div>
          )}

          {!isLoading && currentSources.length === 0 && (
            <div className="source-empty">
              No {activeTab} available
            </div>
          )}

          {!isLoading && currentSources.map(source => (
            <SourceCard
              key={source.id}
              source={source}
              isSelected={selectedSource?.id === source.id}
              onSelect={() => setSelectedSource(source)}
            />
          ))}
        </div>

        <div className="source-picker-footer">
          <button className="source-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="source-share-btn"
            onClick={handleShare}
            disabled={!selectedSource}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
