import { describe, expect, it } from 'vitest'
import { leagueFixture, match } from './__fixtures__/league'
import { aggregateScorers } from './scorers'

const scored = {
  ...match(['301', '1', '2', '2026-09-01T18:00:00.000Z', [3, 1]]),
  scorers: [
    { name: 'Kiss Péter', teamId: '1', goals: 2 },
    { name: 'Nagy Ádám', teamId: '1', goals: 1 },
    { name: 'Tóth Ödön', teamId: '2', goals: 1 },
  ],
}
const scored2 = {
  ...match(['302', '1', '3', '2026-09-08T18:00:00.000Z', [1, 0]]),
  scorers: [{ name: 'Nagy Ádám', teamId: '1', goals: 1 }],
}

describe('aggregateScorers', () => {
  const { rows, coverage } = aggregateScorers([scored, scored2, ...leagueFixture.matches])

  it('sums goals per player and team, ties broken by fewer scoring matches', () => {
    expect(rows.map((r) => [r.name, r.goals, r.matches])).toEqual([
      ['Kiss Péter', 2, 1],
      ['Nagy Ádám', 2, 2],
      ['Tóth Ödön', 1, 1],
    ])
    expect(rows[0]?.rank).toBe(1)
    expect(rows[1]?.rank).toBe(2)
  })

  it('reports how many played matches have scorer data', () => {
    expect(coverage).toEqual({ withScorers: 8, played: 8 })
  })

  it('treats null scorers as unknown coverage', () => {
    const res = aggregateScorers([{ ...scored, scorers: null }])
    expect(res).toEqual({ rows: [], coverage: { withScorers: 0, played: 1 } })
  })
})
