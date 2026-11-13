import { describe, expect, it } from 'vitest'
import { leagueFixture, match } from './__fixtures__/league'
import { positionBounds, simulateFinish } from './projection'

const { teams, matches } = leagueFixture
const ids = teams.map((t) => t.id)

describe('positionBounds', () => {
  it('uses points that are certain: current points vs maximum reachable points', () => {
    // Current points 1:6, 2:4, 3:4, 4:3; remaining: 107 (1-4) and the 2-3 match.
    const b = positionBounds(ids, matches)
    // 4 can still draw level with 1 (max 6) and wins the head-to-head, so nothing is settled yet.
    expect(b.get('1')).toEqual({ best: 1, worst: 4 })
    expect(b.get('4')).toEqual({ best: 1, worst: 4 })
    // Without the 1-4 match, 4 (3 points, nothing left) cannot reach anyone and 1 cannot fall below it.
    const without = positionBounds(ids, matches.filter((m) => m.id !== '107'))
    expect(without.get('4')).toEqual({ best: 4, worst: 4 })
    expect(without.get('1')).toEqual({ best: 1, worst: 3 })
  })

  it('pins every team when nothing is left to play', () => {
    const played = matches.filter((m) => m.status === 'played')
    const b = positionBounds(ids, played)
    expect([...b.values()].every((x) => x.best === x.worst)).toBe(true)
    expect(b.get('1')).toEqual({ best: 1, worst: 1 })
  })
})

describe('simulateFinish', () => {
  it('is deterministic for a seed and every row and column sums to the number of simulations', () => {
    const a = simulateFinish(ids, matches, { sims: 500, seed: 7 })
    const b = simulateFinish(ids, matches, { sims: 500, seed: 7 })
    expect(a).toEqual(b)
    for (const id of ids) expect(a.counts.get(id)?.reduce((n, c) => n + c, 0)).toBe(500)
    for (let pos = 0; pos < ids.length; pos++) {
      expect(ids.reduce((n, id) => n + (a.counts.get(id)?.[pos] ?? 0), 0)).toBe(500)
    }
    expect(a.remaining).toBe(2)
  })

  it('never puts a team outside its certain bounds', () => {
    const sim = simulateFinish(ids, matches, { sims: 500, seed: 1 })
    const bounds = positionBounds(ids, matches)
    for (const id of ids) {
      const { best, worst } = bounds.get(id) ?? { best: 1, worst: 4 }
      sim.counts.get(id)?.forEach((c, i) => {
        if (i + 1 < best || i + 1 > worst) expect(c).toBe(0)
      })
    }
  })

  it('gives the rule-based order with certainty when all matches are played', () => {
    const played = [...matches.filter((m) => m.status === 'played'), match(['201', '4', '2', '2026-09-20T18:00:00.000Z', [1, 0]])]
    const sim = simulateFinish(ids, played, { sims: 50, seed: 3 })
    // 1 and 4 level on 6 points; 4 won their meeting -> 4 first.
    expect(sim.counts.get('4')?.[0]).toBe(50)
    expect(sim.counts.get('1')?.[1]).toBe(50)
    expect(sim.remaining).toBe(0)
  })
})
