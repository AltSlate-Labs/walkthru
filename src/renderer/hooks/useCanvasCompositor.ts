import { useRef, useCallback, useEffect } from 'react'

export interface CompositorOptions {
  webcamPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  webcamSize: number // percentage of screen width (e.g., 0.2 = 20%)
  borderRadius: number
  padding: number
}

const DEFAULT_OPTIONS: CompositorOptions = {
  webcamPosition: 'bottom-right',
  webcamSize: 0.2,
  borderRadius: 12,
  padding: 20
}

interface CompositorState {
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  screenVideo: HTMLVideoElement | null
  webcamVideo: HTMLVideoElement | null
  animationFrameId: number | null
  isRunning: boolean
  options: CompositorOptions
}

function createCompositorState(options: CompositorOptions): CompositorState {
  return {
    canvas: null,
    ctx: null,
    screenVideo: null,
    webcamVideo: null,
    animationFrameId: null,
    isRunning: false,
    options
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function renderFrame(state: CompositorState) {
  if (!state.isRunning) return

  const { ctx, canvas, screenVideo, webcamVideo, options } = state

  if (!ctx || !canvas || !screenVideo) {
    state.animationFrameId = requestAnimationFrame(() => renderFrame(state))
    return
  }

  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw screen capture at full size (only if video has data)
  if (screenVideo.readyState >= 2) {
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
  }

  // Draw webcam with rounded corners if available and ready to play
  if (webcamVideo && webcamVideo.readyState >= 2) {
    const aspectRatio = webcamVideo.videoWidth / webcamVideo.videoHeight || 4/3
    const webcamWidth = canvas.width * options.webcamSize
    const webcamHeight = webcamWidth / aspectRatio

    let x: number, y: number

    switch (options.webcamPosition) {
      case 'bottom-right':
        x = canvas.width - webcamWidth - options.padding
        y = canvas.height - webcamHeight - options.padding
        break
      case 'bottom-left':
        x = options.padding
        y = canvas.height - webcamHeight - options.padding
        break
      case 'top-right':
        x = canvas.width - webcamWidth - options.padding
        y = options.padding
        break
      case 'top-left':
        x = options.padding
        y = options.padding
        break
    }

    ctx.save()
    drawRoundedRect(ctx, x, y, webcamWidth, webcamHeight, options.borderRadius)
    ctx.clip()
    ctx.drawImage(webcamVideo, x, y, webcamWidth, webcamHeight)
    ctx.restore()
  }

  state.animationFrameId = requestAnimationFrame(() => renderFrame(state))
}

function stopCompositor(state: CompositorState) {
  state.isRunning = false

  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId)
    state.animationFrameId = null
  }

  if (state.screenVideo) {
    state.screenVideo.pause()
    state.screenVideo.srcObject = null
    state.screenVideo.remove()
    state.screenVideo = null
  }

  if (state.webcamVideo) {
    state.webcamVideo.pause()
    state.webcamVideo.srcObject = null
    state.webcamVideo.remove()
    state.webcamVideo = null
  }

  state.canvas = null
  state.ctx = null
}

interface UseCanvasCompositorReturn {
  startCompositing: (
    screenStream: MediaStream,
    webcamStream: MediaStream | null
  ) => MediaStream
  stopCompositing: () => void
}

export function useCanvasCompositor(
  options: Partial<CompositorOptions> = {}
): UseCanvasCompositorReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const stateRef = useRef<CompositorState | null>(null)

  const startCompositing = useCallback(
    (screenStream: MediaStream, webcamStream: MediaStream | null): MediaStream => {
      // Clean up any existing compositor
      if (stateRef.current) {
        stopCompositor(stateRef.current)
      }

      // Create new state
      const state = createCompositorState(opts)
      stateRef.current = state

      // Create canvas
      const canvas = document.createElement('canvas')
      state.canvas = canvas

      // Get video track settings for dimensions
      const videoTrack = screenStream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()
      canvas.width = settings.width || 1920
      canvas.height = settings.height || 1080

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas 2d context')
      }
      state.ctx = ctx

      // Create video element for screen stream
      const screenVideo = document.createElement('video')
      screenVideo.srcObject = screenStream
      screenVideo.muted = true
      screenVideo.playsInline = true
      screenVideo.autoplay = true
      screenVideo.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
      document.body.appendChild(screenVideo)
      state.screenVideo = screenVideo

      // Create video element for webcam stream if provided
      if (webcamStream && webcamStream.getVideoTracks().length > 0) {
        const webcamVideo = document.createElement('video')
        webcamVideo.srcObject = webcamStream
        webcamVideo.muted = true
        webcamVideo.playsInline = true
        webcamVideo.autoplay = true
        webcamVideo.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:320px;height:240px;'
        document.body.appendChild(webcamVideo)
        state.webcamVideo = webcamVideo

        // Ensure webcam starts playing
        webcamVideo.play().catch(() => {})
      }

      // Start playing screen video
      screenVideo.play().catch(() => {})

      // Start render loop
      state.isRunning = true
      state.animationFrameId = requestAnimationFrame(() => renderFrame(state))

      // Capture canvas stream at 30fps
      const compositeStream = canvas.captureStream(30)

      return compositeStream
    },
    [opts]
  )

  const stopCompositing = useCallback(() => {
    if (stateRef.current) {
      stopCompositor(stateRef.current)
      stateRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stateRef.current) {
        stopCompositor(stateRef.current)
      }
    }
  }, [])

  return {
    startCompositing,
    stopCompositing
  }
}
