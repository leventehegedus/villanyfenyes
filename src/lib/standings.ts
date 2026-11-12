import type { Match, Mismatch, StandingRow } from './schema'

export type Totals = Pick<
  StandingRow,
  'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst' | 'goalDiff' | 'points'
>

const empty = (): Totals => ({ played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 })

export type PlayedMatch = Match & { homeGoals: number; awayGoals: number }

export const isPlayed = (m: Match): m is PlayedMatch =>
  m.status === 'played' && m.homeGoals !== null && m.awayGoals !== null

function add(t: Totals, gf: number, ga: number): void {
  t.played += 1
  t.goalsFor += gf
  t.goalsAgainst += ga
  t.goalDiff = t.goalsFor - t.goalsAgainst
  if (gf > ga) {
    t.won += 1
    t.points += 3
  } else if (gf === ga) {
    t.drawn += 1
    t.points += 1
  } else t.lost += 1
}

/** Totals per team from played matches only (3 points win, 1 draw). */
export function computeTotals(teamIds: readonly string[], matches: readonly Match[]): Map<string, Totals> {
  const totals = new Map(teamIds.map((id) => [id, empty()]))
  for (const m of matches.filter(isPlayed)) {
    const home = totals.get(m.homeTeamId)
    const away = totals.get(m.awayTeamId)
    if (home) add(home, m.homeGoals, m.awayGoals)
    if (away) add(away, m.awayGoals, m.homeGoals)
  }
  return totals
}

const byPointsGdGf = (a: Totals, b: Totals) =>
  b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor

/**
 * Ranking per the league rules (Versenykiírás, /oldalak/3): points; on equal points a
 * mini-table of the tied teams' matches against each other (points, goal difference, goals
 * scored); then overall goal difference, then overall goals scored. Remaining ties keep input order.
 */
export function rankByRules(teamIds: readonly string[], matches: readonly Match[]): string[] {
  const totals = computeTotals(teamIds, matches)
  const get = (id: string) => totals.get(id) ?? empty()
  const groups = new Map<number, string[]>()
  for (const id of teamIds) groups.set(get(id).points, [...(groups.get(get(id).points) ?? []), id])

  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .flatMap(([, group]) => {
      if (group.length < 2) return group
      const inGroup = new Set(group)
      const mini = computeTotals(
        group,
        matches.filter((m) => inGroup.has(m.homeTeamId) && inGroup.has(m.awayTeamId)),
      )
      return [...group].sort(
        (a, b) =>
          byPointsGdGf(mini.get(a) ?? empty(), mini.get(b) ?? empty()) ||
          get(b).goalDiff - get(a).goalDiff ||
          get(b).goalsFor - get(a).goalsFor,
      )
    })
}

const FIELDS = ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'points'] as const

/**
 * Cross-checks the site's table against stored results. Only teams whose played count matches
 * are compared, so missing match details do not produce noise. Never changes the site table.
 */
export function compareWithSite(
  seasonId: number,
  league: string,
  site: readonly StandingRow[],
  matches: readonly Match[],
): Mismatch[] {
  const totals = computeTotals(
    site.map((r) => r.teamId),
    matches,
  )
  return site.flatMap((row) => {
    const computed = totals.get(row.teamId)
    if (!computed || computed.played !== row.played) return []
    return FIELDS.filter((f) => computed[f] !== row[f]).map((field) => ({
      seasonId,
      league,
      teamId: row.teamId,
      field,
      site: row[field],
      computed: computed[field],
    }))
  })
}

/** True when every team's results are stored and the site's order differs from `rankByRules`. */
export function orderDiffers(site: readonly StandingRow[], matches: readonly Match[]): boolean {
  const ids = site.map((r) => r.teamId)
  const totals = computeTotals(ids, matches)
  if (site.some((r) => totals.get(r.teamId)?.played !== r.played)) return false
  const siteOrder = [...site].sort((a, b) => a.position - b.position).map((r) => r.teamId)
  return rankByRules(ids, matches).join() !== siteOrder.join()
}
