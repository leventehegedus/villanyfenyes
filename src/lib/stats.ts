import type { Match, Team } from './schema'
import { weekStart } from './schedule'
import { isPlayed } from './standings'

export type Outcome = 'W' | 'D' | 'L'

export type TeamResult = {
  matchId: string
  kickoff: string | null
  opponentId: string
  goalsFor: number
  goalsAgainst: number
  outcome: Outcome
}

const outcomeOf = (gf: number, ga: number): Outcome => (gf > ga ? 'W' : gf === ga ? 'D' : 'L')
const POINTS: Record<Outcome, number> = { W: 3, D: 1, L: 0 }

/** Played matches of a team from its own point of view, oldest first. */
export function teamResults(teamId: string, matches: readonly Match[]): TeamResult[] {
  return matches
    .filter(isPlayed)
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? ''))
    .map((m) => {
      const home = m.homeTeamId === teamId
      const gf = home ? m.homeGoals : m.awayGoals
      const ga = home ? m.awayGoals : m.homeGoals
      return {
        matchId: m.id,
        kickoff: m.kickoff,
        opponentId: home ? m.awayTeamId : m.homeTeamId,
        goalsFor: gf,
        goalsAgainst: ga,
        outcome: outcomeOf(gf, ga),
      }
    })
}

/** Highest score per `score`; ties go to the most recent result. */
function best(results: readonly TeamResult[], score: (r: TeamResult) => number | null): TeamResult | null {
  let top: TeamResult | null = null
  let topScore = -Infinity
  for (const r of results) {
    const s = score(r)
    if (s !== null && s >= topScore) {
      top = r
      topScore = s
    }
  }
  return top
}

export function teamStats(teamId: string, matches: readonly Match[]) {
  const results = teamResults(teamId, matches)
  const played = results.length
  const goalsFor = results.reduce((n, r) => n + r.goalsFor, 0)
  const goalsAgainst = results.reduce((n, r) => n + r.goalsAgainst, 0)
  const last = results.at(-1)
  let streakLength = 0
  for (let i = results.length - 1; i >= 0 && results[i]?.outcome === last?.outcome; i--) streakLength++
  let points = 0
  return {
    results,
    played,
    form: results.slice(-5).map((r) => r.outcome),
    streak: last ? { outcome: last.outcome, length: streakLength } : null,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    goalsForPerMatch: played ? goalsFor / played : null,
    goalsAgainstPerMatch: played ? goalsAgainst / played : null,
    cleanSheets: results.filter((r) => r.goalsAgainst === 0).length,
    biggestWin: best(results, (r) => (r.outcome === 'W' ? r.goalsFor - r.goalsAgainst : null)),
    biggestDefeat: best(results, (r) => (r.outcome === 'L' ? r.goalsAgainst - r.goalsFor : null)),
    highestScoring: best(results, (r) => r.goalsFor + r.goalsAgainst),
    pointsProgression: results.map((r) => ({
      matchId: r.matchId,
      kickoff: r.kickoff,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      points: (points += POINTS[r.outcome]),
    })),
  }
}

export type TeamStats = ReturnType<typeof teamStats>

/** League-wide comparison rows computed from stored results. */
export function leagueTable(teams: readonly Team[], matches: readonly Match[]) {
  const rows = teams.map((t) => {
    const s = teamStats(t.id, matches)
    return {
      teamId: t.id,
      name: t.name,
      played: s.played,
      points: s.pointsProgression.at(-1)?.points ?? 0,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff: s.goalDiff,
      goalsForPerMatch: s.goalsForPerMatch,
      goalsAgainstPerMatch: s.goalsAgainstPerMatch,
      cleanSheets: s.cleanSheets,
      recent: s.results.slice(-5),
      streak: s.streak,
    }
  })
  const withGames = rows.filter((r) => r.played > 0)
  const maxAttack = Math.max(...withGames.map((r) => r.goalsForPerMatch ?? 0))
  const minDefence = Math.min(...withGames.map((r) => r.goalsAgainstPerMatch ?? Infinity))
  return rows.map((r) => ({
    ...r,
    bestAttack: r.played > 0 && r.goalsForPerMatch === maxAttack,
    bestDefence: r.played > 0 && r.goalsAgainstPerMatch === minDefence,
  }))
}

export type LeagueStatsRow = ReturnType<typeof leagueTable>[number]

/** Played meetings between two teams, from team `a`'s point of view. */
export function headToHead(a: string, b: string, matches: readonly Match[]) {
  const results = a === b ? [] : teamResults(a, matches).filter((r) => r.opponentId === b)
  const count = (o: Outcome) => results.filter((r) => r.outcome === o).length
  return {
    results,
    wins: count('W'),
    draws: count('D'),
    losses: count('L'),
    goalsFor: results.reduce((n, r) => n + r.goalsFor, 0),
    goalsAgainst: results.reduce((n, r) => n + r.goalsAgainst, 0),
  }
}

/** Cumulative points of every team at the end of each Budapest week that had results. */
export function leagueProgression(teams: readonly Team[], matches: readonly Match[]) {
  const played = matches.filter(isPlayed).filter((m) => m.kickoff !== null)
  const weeks = [...new Set(played.map((m) => weekStart(m.kickoff ?? '')))].sort()
  const totals: Record<string, number> = Object.fromEntries(teams.map((t) => [t.id, 0]))
  return weeks.map((week) => {
    for (const m of played.filter((x) => weekStart(x.kickoff ?? '') === week)) {
      const [h, a] = m.homeGoals > m.awayGoals ? [3, 0] : m.homeGoals === m.awayGoals ? [1, 1] : [0, 3]
      if (m.homeTeamId in totals) totals[m.homeTeamId] = (totals[m.homeTeamId] ?? 0) + h
      if (m.awayTeamId in totals) totals[m.awayTeamId] = (totals[m.awayTeamId] ?? 0) + a
    }
    return { week, points: { ...totals } }
  })
}

/** Lookup of played results between two teams, from the first team's view. */
export function crossTable(teams: readonly Team[], matches: readonly Match[]) {
  const cells = new Map<string, TeamResult[]>()
  for (const t of teams) {
    for (const r of teamResults(t.id, matches)) {
      const key = `${t.id}\u0000${r.opponentId}`
      cells.set(key, [...(cells.get(key) ?? []), r])
    }
  }
  return (a: string, b: string): TeamResult[] => cells.get(`${a}\u0000${b}`) ?? []
}
