import { SCHEMA_VERSION } from './schema'
import type { AllTimeTotals, LeaderboardRow, LeagueFile, Match, MatchRef, SeasonsFile, TeamAllTimeFile } from './schema'
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

function sum(list: readonly AllTimeTotals[]): AllTimeTotals {
  const t = emptyTotals()
  for (const x of list) for (const k of Object.keys(t) as (keyof AllTimeTotals)[]) t[k] += x[k]
  return t
}

const ppm = (t: AllTimeTotals): number | null => (t.played ? t.points / t.played : null)

export function leagueTotals(file: TeamAllTimeFile): { league: string; seasons: number; totals: AllTimeTotals }[] {
  const leagues = [...new Set(file.seasons.map((s) => s.league))].sort((x, y) => x.localeCompare(y))
  return leagues.map((league) => {
    const rows = file.seasons.filter((s) => s.league === league)
    return { league, seasons: rows.length, totals: sum(rows.map((s) => s.totals)) }
  })
}

export const overall = (file: TeamAllTimeFile): AllTimeTotals => sum(file.seasons.map((s) => s.totals))

export const rates = (t: AllTimeTotals) => ({
  winPct: t.played ? (100 * t.won) / t.played : null,
  pointsPerMatch: ppm(t),
  goalDiff: t.goalsFor - t.goalsAgainst,
})

/** Titles, podiums, promotions and relegations per league; the unfinished season does not count. */
export function honours(file: TeamAllTimeFile) {
  const done = file.seasons.filter((s) => s.finished)
  return leagueTotals(file).map(({ league }) => {
    const rows = done.filter((s) => s.league === league)
    const at = (max: number) => rows.filter((s) => s.position !== null && s.position <= max).length
    return {
      league,
      titles: at(1),
      podiums: at(3),
      promotions: rows.filter((s) => s.marker === 'promotion').length,
      relegations: rows.filter((s) => s.marker === 'relegation').length,
    }
  })
}

/** Season ids by points per match among finished seasons; ties: better position, then more recent. */
export function bestWorstSeason(file: TeamAllTimeFile): { best: number | null; worst: number | null } {
  const rows = file.seasons.flatMap((s, recency) => {
    const p = ppm(s.totals)
    return s.finished && p !== null ? [{ id: s.seasonId, p, pos: s.position ?? Infinity, recency }] : []
  })
  const by = (dir: 1 | -1) =>
    [...rows].sort((x, y) => dir * (y.p - x.p) || dir * (x.pos - y.pos) || x.recency - y.recency)[0]?.id ?? null
  return { best: by(1), worst: by(-1) }
}

/** Opponent team ids; favourite and bogey need `minMatches` meetings and are never the same team. */
export function opponentHighlights(file: TeamAllTimeFile, minMatches = 3) {
  const top = <T>(list: readonly T[], score: (x: T) => number) =>
    list.reduce<T | null>((b, x) => (b === null || score(x) > score(b) ? x : b), null)
  const enough = file.opponents.filter((o) => o.totals.played >= minMatches)
  const rate = (o: (typeof enough)[number]) => ppm(o.totals) ?? 0
  const favourite = top(enough, rate)
  const bogey = top(enough, (o) => -rate(o))
  return {
    mostPlayed: top(file.opponents, (o) => o.totals.played)?.teamId ?? null,
    favourite: favourite?.teamId ?? null,
    bogey: bogey && bogey !== favourite ? bogey.teamId : null,
  }
}

export const goalsPerSeason = (file: TeamAllTimeFile) =>
  [...file.seasons].reverse().map((s) => ({
    seasonId: s.seasonId,
    label: s.label,
    forPerMatch: s.totals.played ? s.totals.goalsFor / s.totals.played : null,
    againstPerMatch: s.totals.played ? s.totals.goalsAgainst / s.totals.played : null,
  }))

/** One leaderboard row per team, from its all-time file. */
export const buildLeaderboard = (files: Iterable<TeamAllTimeFile>): LeaderboardRow[] =>
  [...files].map((f) => {
    const l1 = f.seasons.filter((s) => s.league === 'L1')
    const all = overall(f)
    return {
      teamId: f.teamId,
      name: f.names[0] ?? f.teamId,
      titles: l1.filter((s) => s.finished && s.position === 1).length,
      l1Seasons: l1.length,
      won: all.won,
      goalsFor: all.goalsFor,
    }
  })

export type LeaderboardKey = 'titles' | 'l1Seasons' | 'won' | 'goalsFor'

/** Rows with a non-zero value, best first; equal values share a place (1, 1, 3), then by name. */
export function rankBy(rows: readonly LeaderboardRow[], key: LeaderboardKey) {
  const sorted = rows.filter((r) => r[key] > 0).sort((x, y) => y[key] - x[key] || x.name.localeCompare(y.name, 'hu'))
  return sorted.map((r) => ({ ...r, value: r[key], rank: sorted.findIndex((x) => x[key] === r[key]) + 1 }))
}
