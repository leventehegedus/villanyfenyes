import { describe, expect, it } from 'vitest'
import { parseStandingsSort, readHighlight, readMatchFilters, teamRedirect, toggleHighlight, writeHighlight, writeStandingsSort, readWeek } from './url-state'

describe('url state', () => {
  it('reads match filters with defaults', () => {
    expect(readMatchFilters(new URLSearchParams('t=69,100&st=past'), 'upcoming')).toEqual({ teamIds: ['69', '100'], status: 'past' })
    expect(readMatchFilters(new URLSearchParams('st=bogus'), 'upcoming')).toEqual({ teamIds: [], status: 'upcoming' })
  })
  it('parses the standings sort and rejects junk', () => {
    expect(parseStandingsSort('points:desc')).toEqual({ key: 'points', dir: 'desc' })
    expect(parseStandingsSort('name:desc')).toEqual({ key: 'position', dir: 'asc' })
    expect(parseStandingsSort(null)).toEqual({ key: 'position', dir: 'asc' })
  })
})

describe('chart highlight', () => {
  const ids = ['1', '2', '3', '4', '5']
  it('reads known ids from the URL, else falls back', () => {
    expect(readHighlight('2,9,1', ids, ['5'])).toEqual(['2', '1'])
    expect(readHighlight(null, ids, ['5'])).toEqual(['5'])
    expect(readHighlight('', ids, ['5'])).toEqual([])
    expect(readHighlight(writeHighlight([]), ids, ['5'])).toEqual([])
    expect(writeHighlight(['1', '2'])).toBe('1,2')
  })
  it('toggles without a limit', () => {
    expect(toggleHighlight(['1', '2'], '2')).toEqual(['1'])
    expect(toggleHighlight(['1', '2', '3', '4', '5'], '6')).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(readHighlight('1,2,3,4,5', ids, [])).toHaveLength(5)
  })
})

describe('teamRedirect', () => {
  const only = [
    { seasonId: 55, league: 'L1' },
    { seasonId: 54, league: 'L2A' },
  ]
  const all = () => true

  it('keeps a season and league the team played', () => {
    expect(teamRedirect(only, 55, 'L1', all)).toBeNull()
  })
  it('switches to the team league within the chosen season', () => {
    expect(teamRedirect(only, 54, 'L1', all)).toEqual({ seasonId: 54, league: 'L2A' })
  })
  it('falls back to the newest team season', () => {
    expect(teamRedirect(only, 30, 'L1', all)).toEqual({ seasonId: 55, league: 'L1' })
  })
  it('does not redirect to a pair the app cannot select', () => {
    expect(teamRedirect(only, 30, 'L1', () => false)).toBeNull()
  })
  it('does nothing without team seasons', () => {
    expect(teamRedirect(undefined, 30, 'L1', all)).toBeNull()
    expect(teamRedirect([], 30, 'L1', all)).toBeNull()
  })
})

describe('writeStandingsSort', () => {
  it('round-trips with parseStandingsSort and drops the default order', () => {
    expect(writeStandingsSort({ key: 'points', dir: 'asc' })).toBe('points:asc')
    expect(parseStandingsSort(writeStandingsSort({ key: 'goalDiff', dir: 'desc' }))).toEqual({ key: 'goalDiff', dir: 'desc' })
    expect(writeStandingsSort({ key: 'position', dir: 'asc' })).toBeNull()
  })
})

describe('readWeek', () => {
  it('accepts a date and rejects anything else', () => {
    expect(readWeek('2026-10-05')).toBe('2026-10-05')
    expect(readWeek('2026-10')).toBeNull()
    expect(readWeek(null)).toBeNull()
  })
})
