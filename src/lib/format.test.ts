import { describe, expect, it } from 'vitest'
import { formatKickoff, isStale } from './format'

describe('format', () => {
  it('formats kickoff in the chosen time zone', () => {
    expect(formatKickoff('2026-11-11T19:00:00.000Z', 'hu', 'Europe/Budapest')).toMatch(/20:00/)
    expect(formatKickoff('2026-11-11T19:00:00.000Z', 'en', 'UTC')).toMatch(/19:00|7:00/)
    expect(formatKickoff(null, 'hu', 'Europe/Budapest')).toBeNull()
  })

  it('flags stale data after the threshold', () => {
    const now = new Date('2026-11-12T12:00:00Z')
    expect(isStale('2026-11-12T00:00:00Z', now, 48)).toBe(false)
    expect(isStale('2026-11-09T00:00:00Z', now, 48)).toBe(true)
    expect(isStale('garbage', now, 48)).toBe(true)
  })
})
