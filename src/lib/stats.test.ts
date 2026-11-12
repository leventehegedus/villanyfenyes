import { describe, expect, it } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { leagueTable, teamStats } from './stats'

const { matches } = leagueFixture

describe('teamStats', () => {
  const s = teamStats('1', matches)

  it('lists results in date order with W/D/L from the team view', () => {
    expect(s.results.map((r) => r.outcome)).toEqual(['W', 'L', 'W'])
    expect(s.form).toEqual(['W', 'L', 'W'])
  })

  it('computes streak, averages, clean sheets and extremes', () => {
    expect(s.streak).toEqual({ outcome: 'W', length: 1 })
    expect(s.played).toBe(3)
    expect(s.goalsForPerMatch).toBeCloseTo(3)
    expect(s.goalsAgainstPerMatch).toBeCloseTo(5 / 3)
    expect(s.cleanSheets).toBe(0)
    expect(s.biggestWin?.matchId).toBe('105')
    expect(s.biggestDefeat?.matchId).toBe('104')
    expect(s.highestScoring?.matchId).toBe('105')
  })

  it('tracks cumulative points per played match', () => {
    expect(s.pointsProgression.map((p) => p.points)).toEqual([3, 3, 6])
  })

  it('returns empty stats for a team without results', () => {
    const none = teamStats('9', matches)
    expect(none).toMatchObject({ played: 0, form: [], streak: null, goalsForPerMatch: null, biggestWin: null })
  })

  it('counts a clean sheet', () => {
    expect(teamStats('2', matches).cleanSheets).toBe(1)
  })
})

describe('leagueTable', () => {
  it('builds a comparison row per team and flags best attack and defence', () => {
    const table = leagueTable(leagueFixture.teams, matches)
    expect(table).toHaveLength(4)
    expect(table.find((r) => r.teamId === '1')?.bestAttack).toBe(true)
    expect(table.find((r) => r.teamId === '2')?.bestDefence).toBe(true)
  })
})

describe('headToHead', () => {
  it('summarises played meetings from the first team view', async () => {
    const { headToHead } = await import('./stats')
    expect(headToHead('1', '2', matches)).toMatchObject({ wins: 1, draws: 0, losses: 0, goalsFor: 3, goalsAgainst: 1 })
    expect(headToHead('2', '1', matches)).toMatchObject({ wins: 0, losses: 1 })
    expect(headToHead('1', '1', matches).results).toEqual([])
  })
})

describe('leagueProgression', () => {
  it('gives cumulative points per team at the end of each week with results', async () => {
    const { leagueProgression } = await import('./stats')
    const p = leagueProgression(leagueFixture.teams, matches)
    expect(p.map((r) => r.week)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14'])
    expect(p.map((r) => r.points['1'])).toEqual([3, 3, 6])
    expect(p.map((r) => r.points['2'])).toEqual([0, 1, 4])
    expect(p.at(-1)?.points['4']).toBe(3)
  })
})

describe('crossTable', () => {
  it('maps each pair to results from the row team view', async () => {
    const { crossTable } = await import('./stats')
    const cell = crossTable(leagueFixture.teams, matches)
    expect(cell('1', '2').map((r) => [r.goalsFor, r.goalsAgainst, r.outcome, r.matchId])).toEqual([[3, 1, 'W', '101']])
    expect(cell('2', '1').map((r) => r.outcome)).toEqual(['L'])
    expect(cell('1', '1')).toEqual([])
    expect(cell('1', '9')).toEqual([])
  })
})
