import { describe, expect, it } from 'vitest'
import { budapestLocalToUtc } from './time'

describe('budapestLocalToUtc', () => {
  it('converts winter time (CET, UTC+1)', () => {
    expect(budapestLocalToUtc('2026-11-11 20:00:00')).toBe('2026-11-11T19:00:00.000Z')
  })
  it('converts summer time (CEST, UTC+2) and accepts missing seconds', () => {
    expect(budapestLocalToUtc('2026-07-01 20:00')).toBe('2026-07-01T18:00:00.000Z')
  })
  it('returns null for unparseable input', () => {
    expect(budapestLocalToUtc('')).toBeNull()
    expect(budapestLocalToUtc('holnap')).toBeNull()
  })
})
