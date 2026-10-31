import { describe, it, expect } from 'vitest'

function parseDateFromFilename(filename: string): number {
  const match = filename.match(/recording-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).getTime()
  }
  return 0
}

describe('parseDateFromFilename', () => {
  it('parses a valid recording filename', () => {
    const result = parseDateFromFilename('recording-2026-01-17-1430.webm')
    const expected = new Date(2026, 0, 17, 14, 30).getTime()
    expect(result).toBe(expected)
  })

  it('parses midnight correctly', () => {
    const result = parseDateFromFilename('recording-2026-01-01-0000.webm')
    const expected = new Date(2026, 0, 1, 0, 0).getTime()
    expect(result).toBe(expected)
  })

  it('returns 0 for non-matching filenames', () => {
    expect(parseDateFromFilename('random-file.txt')).toBe(0)
    expect(parseDateFromFilename('recording-invalid.webm')).toBe(0)
    expect(parseDateFromFilename('')).toBe(0)
  })

  it('sorts correctly when used as a date comparator', () => {
    const files = [
      'recording-2026-01-17-1430.webm',
      'recording-2026-01-17-0900.webm',
      'recording-2026-01-16-2000.webm'
    ]
    const sorted = [...files].sort(
      (a, b) => parseDateFromFilename(b) - parseDateFromFilename(a)
    )
    expect(sorted[0]).toBe('recording-2026-01-17-1430.webm')
    expect(sorted[2]).toBe('recording-2026-01-16-2000.webm')
  })
})
