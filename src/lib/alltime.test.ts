import { describe, expect, it } from 'vitest'
import { match } from './__fixtures__/league'
import { buildAllTime, duplicateNames } from './alltime'
import type { SeasonLeague } from './alltime'
import type { LeagueFile, Match, SeasonsFile, StandingRow, Team } from './schema'

const row = (teamId: string, position: number, markers: StandingRow['markers'] = []): StandingRow => ({
  position, teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, markers,
})

const file = (seasonId: number, teams: Team[], standings: StandingRow[], matches: Match[]): SeasonLeague => {
  const f: LeagueFile = {
    schemaVersion: 1,
    seasonId,
    league: 'L1',
    sourceUrl: `https://villanyfenyesbajnoksag.hu/tabella?selected_season=${seasonId}&league=L1`,
    teams,
    standings,
    matches,
    summaries: [],
  }
  return { seasonId, league: 'L1', file: f }
}

const team = (id: string, name: string): Team => ({ id, siteId: null, name })

const withScorers = (m: Match, scorers: Match['scorers']): Match => ({ ...m, scorers })

// Season 10 (finished): a W, D, W, W. Season 11 (current): a W, L, D (no kick-off), D (no scorer data).
const older = file(
  10,
  [team('a', 'Old A'), team('b', 'Bé old'), team('c', 'Cé')],
  [row('a', 1, ['promotion', 'winStreak']), row('b', 2), row('c', 3, ['relegation'])],
  [
    match(['m1', 'a', 'b', '2025-03-01T18:00:00.000Z', [3, 0]]),
    match(['m2', 'c', 'a', '2025-03-08T18:00:00.000Z', [1, 1]]),
    withScorers(match(['m3', 'a', 'c', '2025-03-15T18:00:00.000Z', [2, 1]]), [
      { name: 'X', teamId: 'a', goals: 3 },
      { name: 'Y', teamId: 'c', goals: 1 },
    ]),
    match(['m4', 'b', 'a', '2025-03-22T18:00:00.000Z', [0, 5]]),
  ],
)
const current = file(
  11,
  [team('a', 'New A'), team('b', 'Bé new'), team('d', 'Dé')],
  [row('b', 1), row('d', 2)],
  [
    match(['m5', 'a', 'b', '2025-09-01T18:00:00.000Z', [4, 0]]),
    match(['m6', 'd', 'a', '2025-09-08T18:00:00.000Z', [2, 1]]),
    { ...match(['m7', 'a', 'd', '2025-09-10T18:00:00.000Z', [1, 1]]), kickoff: null },
    withScorers(match(['m8', 'a', 'd', '2025-09-15T18:00:00.000Z', [0, 0]]), null),
  ],
)
const seasons: SeasonsFile = {
  schemaVersion: 1,
  currentSeasonId: 11,
  seasons: [
    { id: 11, label: '2025 - Ősz', year: 2025, half: 'osz', start: '2025-09-01', end: '2025-12-19' },
    { id: 10, label: '2025 - Tavasz', year: 2025, half: 'tavasz', start: '2025-02-01', end: '2025-06-01' },
  ],
  leagues: { '10': ['L1'], '11': ['L1'] },
}

const a = () => {
  const f = buildAllTime([older, current], seasons).get('a')
  if (!f) throw new Error('no file for team a')
  return f
}

describe('buildAllTime', () => {
  it('builds totals per season, newest first', () => {
    const f = a()
    expect(f.seasons.map((s) => s.seasonId)).toEqual([11, 10])
    expect(f.seasons[1]?.totals).toEqual({ played: 4, won: 3, drawn: 1, lost: 0, goalsFor: 11, goalsAgainst: 2, points: 10 })
    expect(f.seasons[0]?.totals).toEqual({ played: 4, won: 1, drawn: 2, lost: 1, goalsFor: 6, goalsAgainst: 3, points: 5 })
    expect(f.seasons[1]?.label).toBe('2025 - Tavasz')
    expect(f.seasons[1]?.teamsInLeague).toBe(3)
  })

  it('marks the current season unfinished', () => {
    expect(a().seasons.map((s) => s.finished)).toEqual([false, true])
  })

  it('takes position and marker from the standings', () => {
    const [cur, old] = a().seasons
    expect(old?.position).toBe(1)
    expect(old?.marker).toBe('promotion')
    expect(cur?.position).toBeNull()
    expect(cur?.marker).toBeNull()
  })

  it('finds streaks across seasons and skips matches without kick-off', () => {
    const { win, unbeaten, loss } = a().streaks
    expect(win?.length).toBe(3)
    expect(win?.from.matchId).toBe('m3')
    expect(win?.from.seasonId).toBe(10)
    expect(win?.to.matchId).toBe('m5')
    expect(win?.to.seasonId).toBe(11)
    expect(unbeaten?.length).toBe(5)
    expect(loss?.length).toBe(1)
  })

  it('keeps record matches with their season and league', () => {
    const f = a()
    expect(f.records.biggestWin).toMatchObject({ matchId: 'm4', seasonId: 10, league: 'L1', goalsFor: 5, goalsAgainst: 0, opponentId: 'b' })
    expect(f.records.biggestDefeat).toMatchObject({ matchId: 'm6', seasonId: 11 })
    expect(f.records.highestScoring?.matchId).toBe('m4')
    expect(f.cleanSheets).toBe(4)
    expect(f.failedToScore).toBe(1)
  })

  it('names opponents by their latest name', () => {
    const b = a().opponents.find((o) => o.teamId === 'b')
    expect(b?.name).toBe('Bé new')
    expect(b?.totals).toMatchObject({ played: 3, won: 3, points: 9 })
  })

  it('reports scorer coverage and hat-tricks without counting missing pages', () => {
    const { scorers } = a()
    expect(scorers.playedMatches).toBe(8)
    expect(scorers.coveredMatches).toBe(7)
    expect(scorers.rows).toEqual([{ name: 'X', goals: 3, matches: 1, hatTricks: 1 }])
  })

  it('lists every name of a renamed team, latest first', () => {
    expect(a().names).toEqual(['New A', 'Old A'])
  })
})

describe('duplicateNames', () => {
  it('reports a name used by several team ids', () => {
    const s1 = file(1, [team('1', 'Same')], [], [])
    const s2 = file(2, [team('2', 'Same'), team('3', 'Other')], [], [])
    expect(duplicateNames([s1, s2])).toEqual([{ name: 'Same', ids: ['1', '2'] }])
  })
})
