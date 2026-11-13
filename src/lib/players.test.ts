import { describe, expect, it } from 'vitest'
import { leagueFixture, match } from './__fixtures__/league'
import { playerLog, scorerRace } from './players'
import type { Match } from './schema'

const scored = (m: Match, scorers: { name: string; teamId: string; goals: number }[]): Match => ({ ...m, scorers })
const matches: Match[] = [
  scored(match(['301', '1', '2', '2026-09-01T18:00:00.000Z', [3, 1]]), [
    { name: 'Kiss Péter', teamId: '1', goals: 2 },
    { name: 'Tóth Ödön', teamId: '2', goals: 1 },
  ]),
  scored(match(['302', '3', '1', '2026-09-08T18:00:00.000Z', [2, 1]]), [{ name: 'Kiss Péter', teamId: '1', goals: 1 }]),
  scored(match(['303', '1', '4', '2026-09-15T18:00:00.000Z', [0, 0]]), []),
  { ...match(['304', '1', '2', '2026-09-22T18:00:00.000Z', [1, 0]]), scorers: null },
  match(['305', '1', '3', '2026-12-01T18:00:00.000Z']),
  ...leagueFixture.matches.slice(0, 0),
]

describe('playerLog', () => {
  const log = playerLog('1', 'Kiss Péter', matches)

  it('lists every played team match with the player goals (null when scorers are unknown)', () => {
    expect(log.entries.map((e) => [e.matchId, e.goals])).toEqual([
      ['301', 2],
      ['302', 1],
      ['303', 0],
      ['304', null],
    ])
    expect(log.entries[1]).toMatchObject({ opponentId: '3', home: false, goalsFor: 1, goalsAgainst: 2 })
  })

  it('sums goals and computes scoring streaks over matches with known scorers', () => {
    expect(log).toMatchObject({ goals: 3, matchesScored: 2, longestStreak: 2, currentStreak: 0 })
    expect(playerLog('1', 'Kiss Péter', matches.slice(0, 2)).currentStreak).toBe(2)
  })

  it('returns an empty log for an unknown player', () => {
    expect(playerLog('1', 'Senki', matches)).toMatchObject({ goals: 0, matchesScored: 0, longestStreak: 0 })
  })
})

describe('scorerRace', () => {
  it('gives cumulative goals per week for the top scorers', () => {
    const race = scorerRace(matches, 2)
    expect(race.players.map((p) => p.name)).toEqual(['Kiss Péter', 'Tóth Ödön'])
    expect(race.weeks).toEqual(['2026-08-31', '2026-09-07', '2026-09-14'])
    expect(race.rows.map((r) => r.values[race.players[0]!.key])).toEqual([2, 3, 3])
    expect(race.rows.map((r) => r.values[race.players[1]!.key])).toEqual([1, 1, 1])
  })
})
