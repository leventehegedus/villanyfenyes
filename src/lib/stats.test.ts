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
