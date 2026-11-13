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

describe('matchLabel', () => {
  it('always lists the home team first with the real score', async () => {
    const { matchLabel } = await import('./format')
    const name = (id: string) => ({ a: 'Borg', b: 'Szia Uram!' })[id] ?? id
    expect(matchLabel({ home: true, opponentId: 'b', goalsFor: 2, goalsAgainst: 4 }, 'a', name)).toBe('Borg 2:4 Szia Uram!')
    expect(matchLabel({ home: false, opponentId: 'b', goalsFor: 2, goalsAgainst: 4 }, 'a', name)).toBe('Szia Uram! 4:2 Borg')
  })
})

describe('stepTicks', () => {
  it('covers the maximum in whole steps', async () => {
    const { stepTicks } = await import('./format')
    expect(stepTicks(21, 3)).toEqual([0, 3, 6, 9, 12, 15, 18, 21])
    expect(stepTicks(22, 3).at(-1)).toBe(24)
    expect(stepTicks(0, 3)).toEqual([0, 3])
  })
})
