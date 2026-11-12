import { describe, expect, it } from 'vitest'
import { leagueFixture } from '../../src/lib/__fixtures__/league'
import { dropGate, pageGate } from './gates'
import type { ParsedStandingsPage } from './parse-standings'

const page: ParsedStandingsPage = {
  seasons: [{ id: 55, label: '2026 - Ősz', year: 2026, half: 'osz', start: null, end: null }],
  selectedSeasonId: 55,
  leagues: ['L1'],
  selectedLeague: 'L1',
  rows: [{} as ParsedStandingsPage['rows'][number]],
  skipped: [],
}

describe('pageGate', () => {
  it('passes a page with the requested season and league', () => {
    expect(pageGate(page, 55, 'L1')).toEqual([])
  })
  it('fails when sections are missing or the site served another selection', () => {
    expect(pageGate({ ...page, seasons: [] }, 55, 'L1')).toHaveLength(1)
    expect(pageGate({ ...page, rows: [] }, 55, 'L1')).toEqual([])
    expect(pageGate(page, 54, 'L2A')).toHaveLength(2)
    expect(pageGate({ ...page, selectedSeasonId: null, selectedLeague: null }, 55, 'L1')).toHaveLength(2)
  })
})

describe('dropGate', () => {
  it('allows growth and small drops', () => {
    expect(dropGate(leagueFixture, leagueFixture)).toEqual([])
    expect(dropGate(null, leagueFixture)).toEqual([])
  })
  it('fails when row counts drop by more than the threshold', () => {
    const next = { ...leagueFixture, teams: leagueFixture.teams.slice(0, 2), matches: [] }
    expect(dropGate(leagueFixture, next)).toEqual([
      'L1: teams dropped from 4 to 2',
      'L1: matches dropped from 8 to 0',
    ])
  })
})
