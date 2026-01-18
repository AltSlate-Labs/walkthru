import { useState, useMemo } from 'react'
import { useRecorder } from './hooks/useRecorder'
import { useWebcam } from './hooks/useWebcam'
import { WebcamPreview } from './components/WebcamPreview'
import { Countdown } from './components/Countdown'
import { RecordingTimer } from './components/RecordingTimer'
import { VideoPlayer } from './components/VideoPlayer'

type AppState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped'

function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [audioEnabled, setAudioEnabled] = useState(true)

  const {
    recordedBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recorderError
  } = useRecorder()

  const {
    isEnabled: webcamEnabled,
    stream: webcamStream,
    error: webcamError,
    toggleWebcam,
    disableWebcam
  } = useWebcam()

  // Create object URL for video playback
  const videoUrl = useMemo(() => {
    if (recordedBlob) {
      return URL.createObjectURL(recordedBlob)
    }
    return null
  }, [recordedBlob])

  const handleRecordClick = () => {
    setAppState('countdown')
  }

  const handleCountdownComplete = async () => {
    await startRecording({ audio: audioEnabled, webcamStream: webcamEnabled ? webcamStream : null })
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
      const result = await window.electronAPI.invoke('save-recording', Array.from(uint8Array))
      console.log('Save result:', result)
    } catch (err) {
      console.error('Failed to save recording:', err)
    }
  }

  const handleDiscard = () => {
    // Clean up the object URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setAppState('idle')
  }

  const handleRecordAgain = () => {
    // Clean up the object URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    setAppState('idle')
  }

  const error = recorderError || webcamError
  const isRecordingOrPaused = appState === 'recording' || appState === 'paused'

  return (
    <div className="app">
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
                Save
              </button>
              <button className="secondary-button" onClick={handleRecordAgain}>
                Record Again
              </button>
              <button className="discard-button" onClick={handleDiscard}>
                Discard
              </button>
            </div>
          </div>
        )}
      </main>

      {appState === 'countdown' && (
        <Countdown
          seconds={3}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}

      <WebcamPreview stream={webcamStream} isVisible={webcamEnabled && (appState === 'idle' || appState === 'recording' || appState === 'paused')} />
    </div>
  )
}

export default App
