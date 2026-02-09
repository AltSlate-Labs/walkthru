import { useState, useMemo } from 'react'
import { useRecorder } from './hooks/useRecorder'
import { useWebcam } from './hooks/useWebcam'
import { useRecordings, Recording } from './hooks/useRecordings'
import { useSourcePicker, Source } from './hooks/useSourcePicker'
import { WebcamPreview } from './components/WebcamPreview'
import { Countdown } from './components/Countdown'
import { RecordingTimer } from './components/RecordingTimer'
import { VideoPlayer } from './components/VideoPlayer'
import { RecordingsPanel } from './components/RecordingsPanel'
import { SourcePicker } from './components/SourcePicker'
import { QualitySelector } from './components/QualitySelector'
import type { CameraShape } from './hooks/useCanvasCompositor'
import { QUALITY_PRESETS, type QualityPreset } from './types/recording'
import { estimateSizePerMinute } from './utils/sizeEstimator'

type AppState = 'idle' | 'source-select' | 'countdown' | 'recording' | 'paused' | 'stopped' | 'viewing'

function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [viewingRecording, setViewingRecording] = useState<Recording | null>(null)
  const [cameraShape, setCameraShape] = useState<CameraShape>(() => {
    const saved = localStorage.getItem('walkthru-camera-shape')
    return (saved as CameraShape) || 'rounded-rectangle'
  })
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>(() => {
    const saved = localStorage.getItem('walkthru-quality-preset')
    return (saved as QualityPreset) || 'medium'
  })

  const qualityConfig = QUALITY_PRESETS[qualityPreset]

  const {
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recorderError
  } = useRecorder({ cameraShape, frameRate: qualityConfig.frameRate })

  const {
    isEnabled: webcamEnabled,
    stream: webcamStream,
    error: webcamError,
    toggleWebcam,
    disableWebcam
  } = useWebcam()

  const {
    recordings,
    isLoading: recordingsLoading,
    refreshRecordings,
    deleteRecording,
    exportRecording
  } = useRecordings()

  const { setRecordingSource } = useSourcePicker()

  // Create object URL for video playback
  const videoUrl = useMemo(() => {
    if (recordedBlob) {
      return URL.createObjectURL(recordedBlob)
    }
    return null
  }, [recordedBlob])

  // URL for viewing existing recording
  const viewingUrl = useMemo(() => {
    if (viewingRecording) {
      return `file://${viewingRecording.filepath}`
    }
    return null
  }, [viewingRecording])

  const handleRecordClick = () => {
    setAppState('source-select')
  }

  const handleShapeChange = (shape: CameraShape) => {
    setCameraShape(shape)
    localStorage.setItem('walkthru-camera-shape', shape)
  }

  const handleQualityChange = (preset: QualityPreset) => {
    setQualityPreset(preset)
    localStorage.setItem('walkthru-quality-preset', preset)
  }

  const handleSourceSelect = async (source: Source) => {
    await setRecordingSource(source.id)
    setAppState('countdown')
  }

  const handleSourceCancel = () => {
    setAppState('idle')
  }

  const handleCountdownComplete = async () => {
    await startRecording({
      audio: audioEnabled,
      webcamStream: webcamEnabled ? webcamStream : null,
      qualityConfig: qualityConfig
    })
    setAppState('recording')
  }

  const handleCountdownCancel = () => {
    setAppState('idle')
  }

  const handlePause = () => {
    pauseRecording()
    setAppState('paused')
  }

  const handleResume = () => {
    resumeRecording()
    setAppState('recording')
  }

  const handleStop = () => {
    stopRecording()
    disableWebcam()
    setAppState('stopped')
  }

  const handleSave = async () => {
    if (!recordedBlob) return

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      await window.electronAPI.invoke('save-recording', uint8Array)
      await refreshRecordings()

      // Cleanup and go back to idle to show the new recording in list
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
      setAppState('idle')
    } catch (err) {
      console.error('Failed to save recording:', err)
    }
  }

  const handleDiscard = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setAppState('idle')
  }

  const handleRecordAgain = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setAppState('idle')
  }

  // Recordings panel handlers
  const handlePlayRecording = (recording: Recording) => {
    setViewingRecording(recording)
    setAppState('viewing')
  }

  const handleExportRecording = async (recording: Recording) => {
    await exportRecording(recording.filepath)
  }

  const handleDeleteRecording = async (recording: Recording) => {
    const confirmed = window.confirm(`Delete "${recording.filename}"? It will be moved to trash.`)
    if (confirmed) {
      await deleteRecording(recording.filepath)
      if (viewingRecording?.id === recording.id) {
        setViewingRecording(null)
        setAppState('idle')
      }
    }
  }

  const handleBackFromViewing = () => {
    setViewingRecording(null)
    setAppState('idle')
  }

  const error = recorderError || webcamError
  const isRecordingOrPaused = appState === 'recording' || appState === 'paused'

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <RecordingsPanel
          recordings={recordings}
          isLoading={recordingsLoading}
          onPlay={handlePlayRecording}
          onExport={handleExportRecording}
          onDelete={handleDeleteRecording}
        />
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h1>Walkthru</h1>
          <p>Local-first screen recording</p>
        </header>

        <main className="main">
          {error && (
            <div className="error">{error}</div>
          )}

          {appState === 'idle' && (
            <>
              <div className="options">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                  />
                  <span className="toggle-label">Microphone</span>
                </label>

                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={webcamEnabled}
                    onChange={toggleWebcam}
                  />
                  <span className="toggle-label">Camera</span>
                </label>

                {webcamEnabled && (
                  <div className="shape-selector">
                    <span className="shape-label">Camera Shape</span>
                    <div className="shape-buttons">
                      <button
                        className={`shape-btn ${cameraShape === 'rectangle' ? 'active' : ''}`}
                        onClick={() => handleShapeChange('rectangle')}
                      >
                        <span className="shape-icon">▭</span> Rectangle
                      </button>
                      <button
                        className={`shape-btn ${cameraShape === 'rounded-rectangle' ? 'active' : ''}`}
                        onClick={() => handleShapeChange('rounded-rectangle')}
                      >
                        <span className="shape-icon">▢</span> Rounded
                      </button>
                      <button
                        className={`shape-btn ${cameraShape === 'circle' ? 'active' : ''}`}
                        onClick={() => handleShapeChange('circle')}
                      >
                        <span className="shape-icon">●</span> Circle
                      </button>
                    </div>
                  </div>
                )}

                <QualitySelector
                  selected={qualityPreset}
                  onChange={handleQualityChange}
                />

                <div className="size-estimator">
                  Estimated: {estimateSizePerMinute(qualityConfig, audioEnabled)}
                </div>
              </div>

              <button className="record-button" onClick={handleRecordClick}>
                Record
              </button>
            </>
          )}

          {isRecordingOrPaused && (
            <div className="recording-controls">
              <div className="recording-indicator">
                <span className={`recording-dot ${appState === 'paused' ? 'paused' : ''}`} />
                {appState === 'paused' ? 'Paused' : 'Recording'}
              </div>

              <RecordingTimer isRunning={appState === 'recording'} />

              <div className="button-group">
                {appState === 'recording' ? (
                  <button className="pause-button" onClick={handlePause}>
                    Pause
                  </button>
                ) : (
                  <button className="resume-button" onClick={handleResume}>
                    Resume
                  </button>
                )}
                <button className="stop-button" onClick={handleStop}>
                  Stop
                </button>
              </div>
            </div>
          )}

          {appState === 'stopped' && recordedBlob && videoUrl && (
            <div className="preview-screen">
              <VideoPlayer src={videoUrl} />

              <p className="preview-info">
                {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
              </p>

              <div className="button-group">
                <button className="save-button" onClick={handleSave}>
                  Save as WebM
                </button>
              </div>

              <div className="button-group">
                <button className="secondary-button" onClick={handleRecordAgain}>
                  Record Again
                </button>
                <button className="discard-button" onClick={handleDiscard}>
                  Discard
                </button>
              </div>
            </div>
          )}

          {appState === 'viewing' && viewingRecording && viewingUrl && (
            <div className="preview-screen">
              <VideoPlayer src={viewingUrl} />

              <p className="preview-info">
                {viewingRecording.filename}
              </p>

              <div className="button-group">
                <button className="secondary-button" onClick={() => handleExportRecording(viewingRecording)}>
                  Export
                </button>
                <button className="secondary-button" onClick={handleBackFromViewing}>
                  Back
                </button>
                <button className="discard-button" onClick={() => handleDeleteRecording(viewingRecording)}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Source Picker Modal */}
      <SourcePicker
        isOpen={appState === 'source-select'}
        onSelect={handleSourceSelect}
        onCancel={handleSourceCancel}
      />

      {/* Countdown Overlay */}
      {appState === 'countdown' && (
        <Countdown
          seconds={3}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}

      {/* Webcam Preview */}
      <WebcamPreview
        stream={webcamStream}
        isVisible={webcamEnabled && (appState === 'idle' || appState === 'recording' || appState === 'paused')}
        cameraShape={cameraShape}
      />
    </div>
  )
}

export default App
