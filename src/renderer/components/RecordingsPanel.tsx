import { Recording } from '../hooks/useRecordings'

interface RecordingsPanelProps {
  recordings: Recording[]
  isLoading: boolean
  onPlay: (recording: Recording) => void
  onExport: (recording: Recording) => void
  onDelete: (recording: Recording) => void
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown date'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface RecordingItemProps {
  recording: Recording
  onPlay: () => void
  onExport: () => void
  onDelete: () => void
}

function RecordingItem({ recording, onPlay, onExport, onDelete }: RecordingItemProps) {
  return (
    <div className="recording-item" onClick={onPlay}>
      <div className="recording-thumbnail-placeholder">
        <span className="recording-icon">▶</span>
      </div>
      <div className="recording-info">
        <div className="recording-name" title={recording.filename}>
          {recording.filename.replace('.webm', '')}
        </div>
        <div className="recording-meta">
          {formatDate(recording.date)} · {formatSize(recording.size)}
        </div>
      </div>
      <div className="recording-actions" onClick={e => e.stopPropagation()}>
        <button
          className="recording-action-btn"
          onClick={onExport}
          title="Export"
        >
          ↗
        </button>
        <button
          className="recording-action-btn recording-action-delete"
          onClick={onDelete}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function RecordingsPanel({
  recordings,
  isLoading,
  onPlay,
  onExport,
  onDelete
}: RecordingsPanelProps) {
  return (
    <div className="recordings-panel">
      <div className="recordings-header">
        <h2>Recordings</h2>
      </div>

      <div className="recordings-list">
        {isLoading && (
          <div className="recordings-loading">Loading...</div>
        )}

        {!isLoading && recordings.length === 0 && (
          <div className="recordings-empty">
            <p>No recordings yet</p>
            <p className="recordings-empty-hint">
              Click Record to create your first recording
            </p>
          </div>
        )}

        {!isLoading && recordings.map(recording => (
          <RecordingItem
            key={recording.id}
            recording={recording}
            onPlay={() => onPlay(recording)}
            onExport={() => onExport(recording)}
            onDelete={() => onDelete(recording)}
          />
        ))}
      </div>
    </div>
  )
}
