export type QualityPreset = 'low' | 'medium' | 'high'

export interface RecordingQualityConfig {
  preset: QualityPreset
  width: number
  height: number
  frameRate: number
  audioBitrate: number
}

export const QUALITY_PRESETS: Record<QualityPreset, RecordingQualityConfig> = {
  low: {
    preset: 'low',
    width: 1280,
    height: 720,
    frameRate: 15,
    audioBitrate: 64000
  },
  medium: {
    preset: 'medium',
    width: 1920,
    height: 1080,
    frameRate: 30,
    audioBitrate: 128000
  },
  high: {
    preset: 'high',
    width: 1920,
    height: 1080,
    frameRate: 60,
    audioBitrate: 192000
  }
}
