import type { RecordingQualityConfig } from '../types/recording'

/**
 * Empirical video bitrates for VP9 encoding
 * Based on typical WebM VP9 encoding at different resolutions/framerates
 */
function getVideoBitrateKbps(config: RecordingQualityConfig): number {
  const { width, height, frameRate } = config

  // 720p at 15fps
  if (width <= 1280 && height <= 720 && frameRate <= 15) {
    return 800
  }

  // 1080p at 30fps
  if (width <= 1920 && height <= 1080 && frameRate <= 30) {
    return 2500
  }

  // 1080p at 60fps
  if (width <= 1920 && height <= 1080 && frameRate <= 60) {
    return 5000
  }

  // Fallback for other configurations
  const pixels = width * height
  const pixelsPerSecond = pixels * frameRate
  // Rough estimate: ~0.1 bits per pixel per second for VP9
  return Math.round((pixelsPerSecond * 0.1) / 1000)
}

/**
 * Format bytes into human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toFixed(0)} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

/**
 * Estimate file size per minute of recording
 * @param config Quality configuration
 * @param hasAudio Whether audio is enabled
 * @returns Formatted string like "~1.5 MB/min"
 */
export function estimateSizePerMinute(
  config: RecordingQualityConfig,
  hasAudio: boolean
): string {
  const videoBitrateKbps = getVideoBitrateKbps(config)
  const audioBitrateKbps = hasAudio ? config.audioBitrate / 1000 : 0
  const totalKbps = videoBitrateKbps + audioBitrateKbps

  // Calculate bytes per minute
  // kbps * 60 seconds * 1000 bits/kilobit / 8 bits/byte
  const bytesPerMin = (totalKbps * 60 * 1000) / 8

  return `~${formatBytes(bytesPerMin)}/min`
}
