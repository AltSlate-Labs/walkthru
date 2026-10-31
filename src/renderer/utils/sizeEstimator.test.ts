import { describe, it, expect } from 'vitest'
import { estimateSizePerMinute } from './sizeEstimator'
import type { RecordingQualityConfig } from '../types/recording'

const baseConfig: RecordingQualityConfig = {
  preset: 'medium',
  width: 1920,
  height: 1080,
  frameRate: 30,
  audioBitrate: 128000
}

describe('estimateSizePerMinute', () => {
  it('returns a formatted string with MB/min', () => {
    const result = estimateSizePerMinute(baseConfig, true)
    expect(result).toMatch(/~[\d.]+ MB\/min/)
  })

  it('returns a smaller estimate without audio', () => {
    const withAudio = estimateSizePerMinute(baseConfig, true)
    const withoutAudio = estimateSizePerMinute(baseConfig, false)

    const withAudioBytes = parseFloat(withAudio.replace('~', '').replace(' MB/min', ''))
    const withoutAudioBytes = parseFloat(withoutAudio.replace('~', '').replace(' MB/min', ''))

    expect(withoutAudioBytes).toBeLessThan(withAudioBytes)
  })

  it('returns lower estimate for low quality preset', () => {
    const lowConfig: RecordingQualityConfig = {
      preset: 'low',
      width: 1280,
      height: 720,
      frameRate: 15,
      audioBitrate: 64000
    }
    const lowEstimate = estimateSizePerMinute(lowConfig, true)
    const mediumEstimate = estimateSizePerMinute(baseConfig, true)

    const lowBytes = parseFloat(lowEstimate.replace('~', '').replace(' MB/min', ''))
    const mediumBytes = parseFloat(mediumEstimate.replace('~', '').replace(' MB/min', ''))

    expect(lowBytes).toBeLessThan(mediumBytes)
  })

  it('returns higher estimate for high quality preset', () => {
    const highConfig: RecordingQualityConfig = {
      preset: 'high',
      width: 1920,
      height: 1080,
      frameRate: 60,
      audioBitrate: 192000
    }
    const highEstimate = estimateSizePerMinute(highConfig, true)
    const mediumEstimate = estimateSizePerMinute(baseConfig, true)

    const highBytes = parseFloat(highEstimate.replace('~', '').replace(' MB/min', ''))
    const mediumBytes = parseFloat(mediumEstimate.replace('~', '').replace(' MB/min', ''))

    expect(highBytes).toBeGreaterThan(mediumBytes)
  })
})
