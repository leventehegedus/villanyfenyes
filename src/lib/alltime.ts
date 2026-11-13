import { SCHEMA_VERSION } from './schema'
import type { AllTimeTotals, LeagueFile, Match, MatchRef, SeasonsFile, TeamAllTimeFile } from './schema'
import { isPlayed } from './standings'
import { POINTS, teamResults, teamStats } from './stats'
import type { TeamResult } from './stats'

export type SeasonLeague = { seasonId: number; league: string; file: LeagueFile }

type Streak = NonNullable<TeamAllTimeFile['streaks']['win']>

const emptyTotals = (): AllTimeTotals => ({ played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 })

function totalsOf(results: readonly TeamResult[]): AllTimeTotals {
  const t = emptyTotals()
  for (const r of results) {
    t.played += 1
    t.goalsFor += r.goalsFor
    t.goalsAgainst += r.goalsAgainst
    t.points += POINTS[r.outcome]
    if (r.outcome === 'W') t.won += 1
    else if (r.outcome === 'D') t.drawn += 1
    else t.lost += 1
  }
  return t
}

/** Longest run of results matching `ok`; ties go to the most recent run. */
function longest(results: readonly TeamResult[], ok: (r: TeamResult) => boolean, ref: (r: TeamResult) => MatchRef): Streak | null {
  let top: Streak | null = null
  let start: TeamResult | null = null
  let length = 0
  for (const r of results) {
    if (!ok(r)) {
      length = 0
      continue
    }
    if (length === 0) start = r
    length += 1
    if (start && (!top || length >= top.length)) top = { length, from: ref(start), to: ref(r) }
  }
  return top
}

function scorerTable(teamId: string, matches: readonly Match[]) {
  const played = matches.filter(isPlayed).filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
  const rows = new Map<string, { name: string; goals: number; matches: number; hatTricks: number }>()
  for (const m of played) {
    for (const s of m.scorers ?? []) {
      if (s.teamId !== teamId) continue
      const r = rows.get(s.name) ?? { name: s.name, goals: 0, matches: 0, hatTricks: 0 }
      r.goals += s.goals
      r.matches += 1
      if (s.goals >= 3) r.hatTricks += 1
      rows.set(s.name, r)
    }
  }
  return {
    playedMatches: played.length,
    coveredMatches: played.filter((m) => m.scorers !== null).length,
    rows: [...rows.values()].sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name, 'hu')),
  }
}

/** Oldest season first; seasons.json lists newest first, unknown seasons count as oldest. */
function chronological(inputs: readonly SeasonLeague[], seasons: SeasonsFile): SeasonLeague[] {
  const rank = (id: number) => {
    const i = seasons.seasons.findIndex((s) => s.id === id)
    return i === -1 ? Infinity : i
  }
  return [...inputs].sort((x, y) => rank(y.seasonId) - rank(x.seasonId))
}

/** One all-time summary per team id found in any league file. */
export function buildAllTime(inputs: readonly SeasonLeague[], seasons: SeasonsFile): Map<string, TeamAllTimeFile> {
  const ordered = chronological(inputs, seasons)
  const latestName = new Map<string, string>()
  const where = new Map<string, { seasonId: number; league: string }>()
  for (const { seasonId, league, file } of ordered) {
    for (const t of file.teams) latestName.set(t.id, t.name)
    for (const m of file.matches) where.set(m.id, { seasonId, league })
  }
  const allMatches = ordered.flatMap((x) => x.file.matches)

  const out = new Map<string, TeamAllTimeFile>()
  for (const teamId of latestName.keys()) {
    const played = ordered.filter((x) => x.file.teams.some((t) => t.id === teamId))
    const ref = (r: TeamResult): MatchRef => {
      const at = where.get(r.matchId) ?? { seasonId: 0, league: 'L1' }
      return { ...at, matchId: r.matchId, kickoff: r.kickoff, opponentId: r.opponentId, goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst }
    }
    const stats = teamStats(teamId, allMatches)
    const timed = stats.results.filter((r) => r.kickoff !== null)
    const byOpponent = new Map<string, TeamResult[]>()
    for (const r of stats.results) byOpponent.set(r.opponentId, [...(byOpponent.get(r.opponentId) ?? []), r])
    const names = [...new Set(played.map((x) => x.file.teams.find((t) => t.id === teamId)?.name ?? teamId).reverse())]
    const opt = (r: TeamResult | null) => (r ? ref(r) : null)

    out.set(teamId, {
      schemaVersion: SCHEMA_VERSION,
      teamId,
      names,
      seasons: played
        .map(({ seasonId, league, file }) => {
          const row = file.standings.find((s) => s.teamId === teamId)
          const marker = row?.markers.includes('promotion') ? 'promotion' : row?.markers.includes('relegation') ? 'relegation' : null
          return {
            seasonId,
            label: seasons.seasons.find((s) => s.id === seasonId)?.label ?? String(seasonId),
            league,
            finished: seasonId !== seasons.currentSeasonId,
            position: row?.position ?? null,
            teamsInLeague: file.standings.length || file.teams.length,
            marker,
            totals: totalsOf(teamResults(teamId, file.matches)),
          } as const
        })
        .reverse(),
      opponents: [...byOpponent].map(([id, results]) => ({ teamId: id, name: latestName.get(id) ?? id, totals: totalsOf(results) })),
      records: { biggestWin: opt(stats.biggestWin), biggestDefeat: opt(stats.biggestDefeat), highestScoring: opt(stats.highestScoring) },
      streaks: {
        win: longest(timed, (r) => r.outcome === 'W', ref),
        unbeaten: longest(timed, (r) => r.outcome !== 'L', ref),
        loss: longest(timed, (r) => r.outcome === 'L', ref),
      },
      cleanSheets: stats.cleanSheets,
      failedToScore: stats.results.filter((r) => r.goalsFor === 0).length,
      scorers: scorerTable(teamId, allMatches),
    })
  }
  return out
}

/** Names that appear under more than one team id (the site may have re-created a team). */
export function duplicateNames(inputs: readonly SeasonLeague[]): { name: string; ids: string[] }[] {
  const ids = new Map<string, Set<string>>()
  for (const { file } of inputs) for (const t of file.teams) ids.set(t.name, (ids.get(t.name) ?? new Set()).add(t.id))
  return [...ids].filter(([, s]) => s.size > 1).map(([name, s]) => ({ name, ids: [...s] }))
}
