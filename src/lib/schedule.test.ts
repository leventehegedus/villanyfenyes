import { describe, expect, it } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { filterMatches, groupByWeek, lastResult, nextMatch, weekStart } from './schedule'

const { matches } = leagueFixture
const now = new Date('2026-10-20T00:00:00Z')

describe('schedule', () => {
  it('finds the next and the last match for a team', () => {
    expect(nextMatch('2', matches, now)?.id).toBe('x-55-L1-202610271800-banditak-csak-oda-vissza')
    expect(lastResult('2', matches)?.id).toBe('106')
    expect(nextMatch('4', matches, now)).toBeNull()
  })

  it('filters by team, status and favourites', () => {
    expect(filterMatches(matches, { teamId: '4' }).map((m) => m.id)).toEqual(['102', '104', '106', '107'])
    expect(filterMatches(matches, { status: 'upcoming' }, now)).toHaveLength(1)
    expect(filterMatches(matches, { status: 'played' })).toHaveLength(6)
    expect(filterMatches(matches, { favourites: new Set(['3']) })).toHaveLength(4)
  })

  it('treats a past match without a score as neither played nor upcoming', () => {
    const ids = [...filterMatches(matches, { status: 'played' }), ...filterMatches(matches, { status: 'upcoming' }, now)].map((m) => m.id)
    expect(ids).not.toContain('107')
  })

  it('groups by Budapest week (Monday start), matches without kickoff last', () => {
    const groups = groupByWeek([...matches, { ...matches[0]!, id: 'tbd', kickoff: null }])
    expect(groups[0]?.week).toBe('2026-08-31')
    expect(groups.at(-1)).toMatchObject({ week: null })
    expect(groups.find((g) => g.week === '2026-09-14')?.matches).toHaveLength(2)
  })

  it('computes week start in Budapest time across midnight', () => {
    // Sunday 23:30 UTC is Monday 00:30 in Budapest (CET).
    expect(weekStart('2026-11-15T23:30:00.000Z')).toBe('2026-11-16')
  })
})
