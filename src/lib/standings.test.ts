import { describe, expect, it } from 'vitest'
import { leagueFixture, match } from './__fixtures__/league'
import { compareWithSite, computeTotals, rankByRules } from './standings'

const { teams, matches, standings } = leagueFixture
const ids = teams.map((t) => t.id)

describe('computeTotals', () => {
  it('counts only played matches', () => {
    const totals = computeTotals(ids, matches)
    expect(totals.get('1')).toEqual({ played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 9, goalsAgainst: 5, goalDiff: 4, points: 6 })
    expect(totals.get('3')).toMatchObject({ played: 3, drawn: 1, points: 4 })
  })
})

describe('rankByRules', () => {
  it('orders by points, then head-to-head, then goal difference, then goals', () => {
    // 2 and 3 are level on 4 points and drew each other: falls through to overall goal difference.
    expect(rankByRules(ids, matches)).toEqual(['1', '2', '3', '4'])
  })

  it('uses the head-to-head result before goal difference', () => {
    const extra = [...matches, match(['201', '4', '2', '2026-09-20T18:00:00.000Z', [1, 0]])]
    // 1 and 4 now both have 6 points: 4 won their meeting, so 4 ranks above 1 despite a worse goal difference.
    expect(rankByRules(ids, extra)).toEqual(['4', '1', '2', '3'])
  })
})

describe('compareWithSite', () => {
  it('reports nothing when the site table matches the results', () => {
    expect(compareWithSite(55, 'L1', standings, matches)).toEqual([])
  })

  it('reports every differing field', () => {
    const site = standings.map((r) => (r.teamId === '4' ? { ...r, points: 5 } : r))
    expect(compareWithSite(55, 'L1', site, matches)).toEqual([
      { seasonId: 55, league: 'L1', teamId: '4', field: 'points', site: 5, computed: 3 },
    ])
  })

  it('stays quiet for a team whose results are not all known yet', () => {
    const site = standings.map((r) => (r.teamId === '4' ? { ...r, played: 4, points: 6 } : r))
    expect(compareWithSite(55, 'L1', site, matches)).toEqual([])
  })
})

describe('orderDiffers', () => {
  it('compares the site order with the rule order only when all results are known', async () => {
    const { orderDiffers } = await import('./standings')
    expect(orderDiffers(standings, matches)).toBe(false)
    const swapped = standings.map((r) => (r.teamId === '2' ? { ...r, position: 3 } : r.teamId === '3' ? { ...r, position: 2 } : r))
    expect(orderDiffers(swapped, matches)).toBe(true)
    const incomplete = standings.map((r) => (r.teamId === '4' ? { ...r, played: 4 } : r))
    expect(orderDiffers(incomplete, matches)).toBe(false)
  })
})
