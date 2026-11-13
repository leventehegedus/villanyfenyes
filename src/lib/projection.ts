import type { Match } from './schema'
import { computeTotals, isPlayed, rankByRules } from './standings'

export type Bounds = { best: number; worst: number }

/**
 * Positions that are mathematically certain from points alone: teams already above a team's
 * maximum stay above it, teams whose maximum is below its current points stay below it.
 * Tie-breaks are not assumed, so every position inside the bounds may still be possible.
 */
export function positionBounds(teamIds: readonly string[], matches: readonly Match[]): Map<string, Bounds> {
  if (matches.every(isPlayed)) {
    // Nothing left: the rules settle every tie, so each team has exactly one position.
    return new Map(rankByRules(teamIds, matches).map((id, i) => [id, { best: i + 1, worst: i + 1 }]))
  }
  const now = computeTotals(teamIds, matches)
  const left = new Map(teamIds.map((id) => [id, 0]))
  for (const m of matches.filter((x) => !isPlayed(x))) {
    for (const id of [m.homeTeamId, m.awayTeamId]) if (left.has(id)) left.set(id, (left.get(id) ?? 0) + 1)
  }
  const pts = (id: string) => now.get(id)?.points ?? 0
  const max = (id: string) => pts(id) + 3 * (left.get(id) ?? 0)
  return new Map(
    teamIds.map((id) => {
      const others = teamIds.filter((o) => o !== id)
      return [
        id,
        {
          best: 1 + others.filter((o) => pts(o) > max(id)).length,
          worst: teamIds.length - others.filter((o) => max(o) < pts(id)).length,
        },
      ]
    }),
  )
}

/** Small seeded PRNG (mulberry32) so a page shows the same numbers on every render. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function poisson(lambda: number, random: () => number): number {
  const limit = Math.exp(-lambda)
  let k = 0
  for (let p = random(); p > limit; p *= random()) k++
  return k
}

const SHRINK = 3 // pseudo-matches at the league average, so a few results do not dominate

/** Expected goals per team: attack and defence from played matches, shrunk to the league average. */
function strengths(teamIds: readonly string[], matches: readonly Match[]) {
  const totals = computeTotals(teamIds, matches)
  const played = [...totals.values()].reduce((n, t) => n + t.played, 0)
  const goals = [...totals.values()].reduce((n, t) => n + t.goalsFor, 0)
  const avg = played > 0 ? goals / played : 3
  const rate = (sum: number, n: number) => (sum + SHRINK * avg) / (n + SHRINK) / avg
  const attack = new Map(teamIds.map((id) => [id, rate(totals.get(id)?.goalsFor ?? 0, totals.get(id)?.played ?? 0)]))
  const defence = new Map(teamIds.map((id) => [id, rate(totals.get(id)?.goalsAgainst ?? 0, totals.get(id)?.played ?? 0)]))
  return (home: string, away: string): [number, number] => [
    avg * (attack.get(home) ?? 1) * (defence.get(away) ?? 1),
    avg * (attack.get(away) ?? 1) * (defence.get(home) ?? 1),
  ]
}

/**
 * Monte Carlo season finish: every match without a stored score is played out with Poisson goals,
 * then teams are ranked by the league rules (points, head-to-head mini-table, goal difference,
 * goals). counts.get(team)[i] = how many simulations ended with the team in position i + 1.
 */
export function simulateFinish(
  teamIds: readonly string[],
  matches: readonly Match[],
  { sims = 5000, seed = 1 }: { sims?: number; seed?: number } = {},
) {
  const random = rng(seed)
  const played = matches.filter(isPlayed)
  const open = matches.filter((m) => !isPlayed(m))
  const expected = strengths(teamIds, played)
  const counts = new Map(teamIds.map((id) => [id, Array<number>(teamIds.length).fill(0)]))
  for (let s = 0; s < sims; s++) {
    const simulated = open.map((m): Match => {
      const [lh, la] = expected(m.homeTeamId, m.awayTeamId)
      return { ...m, status: 'played', homeGoals: poisson(lh, random), awayGoals: poisson(la, random) }
    })
    rankByRules(teamIds, [...played, ...simulated]).forEach((id, i) => {
      const row = counts.get(id)
      if (row) row[i] = (row[i] ?? 0) + 1
    })
  }
  return { counts, sims, remaining: open.length }
}
