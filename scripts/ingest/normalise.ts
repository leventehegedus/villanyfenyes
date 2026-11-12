import { SCHEMA_VERSION } from '../../src/lib/schema.ts'
import type { LeagueFile, Match, Scorer, Team } from '../../src/lib/schema.ts'
import { budapestLocalToUtc } from '../../src/lib/time.ts'
import type { ParsedGoal, ParsedMatchPage } from './parse-match.ts'
import type { FixtureCard, ParsedRow, ParsedStandingsPage } from './parse-standings.ts'
import { slug } from './text.ts'

export type MatchDetail = { page: ParsedMatchPage; fetchedAt: string }

export type BuildInput = {
  seasonId: number
  league: string
  sourceUrl: string
  page: ParsedStandingsPage
  details: ReadonlyMap<number, MatchDetail>
  previous: LeagueFile | null
  now: Date
}

const HOUR = 3_600_000
const UPLOAD_WINDOW = 4 * 24 * HOUR // results are uploaded within 3 days of the match
const GIVE_UP_AFTER = 14 * 24 * HOUR // a match still without a score by then is not refetched

/** Splits "Home - Away" using the league's known team names (names may contain " - "). */
export function splitTeams(text: string, names: readonly string[]): [string, string] | null {
  const known = new Set(names)
  for (let i = text.indexOf(' - '); i !== -1; i = text.indexOf(' - ', i + 1)) {
    const home = text.slice(0, i)
    const away = text.slice(i + 3)
    if (known.has(home) && known.has(away)) return [home, away]
  }
  return null
}

/** Whether a linked match page should be (re)fetched this run. */
export function needsDetail(
  prev: Pick<Match, 'status' | 'detailFetchedAt'> | undefined,
  kickoff: string | null,
  now: Date,
): boolean {
  if (!prev?.detailFetchedAt) return true
  const age = now.getTime() - Date.parse(prev.detailFetchedAt)
  const kick = kickoff ? Date.parse(kickoff) : 0
  if (prev.status !== 'played') return age >= 2 * HOUR && now.getTime() < kick + GIVE_UP_AFTER
  const fetchedInsideWindow = Date.parse(prev.detailFetchedAt) < kick + UPLOAD_WINDOW
  return fetchedInsideWindow && age >= 24 * HOUR
}

/** Team id from its result links; an id already used in the previous file wins so favourites stay valid. */
function teamFor(row: ParsedRow, previousIds: ReadonlyMap<string, string>): Team {
  const siteId = row.cards.find((c) => c.ownerTeamId !== null)?.ownerTeamId ?? null
  const id = previousIds.get(row.name) ?? (siteId === null ? `x-${slug(row.name)}` : String(siteId))
  return { id, siteId, name: row.name }
}

const scorersFor = (goals: ParsedGoal[], teamId: string): Scorer[] =>
  goals.map((g) => ({ name: g.name, goals: g.goals, teamId }))

type Pair = { homeId: string; awayId: string; home: string; away: string }

/** Applies a fetched match page; returns an error string when its teams do not fit the card. */
function applyDetail(base: Match, pair: Pair, detail: MatchDetail, prev: Match | undefined): Match | string {
  const { page } = detail
  const straight = page.homeName === pair.home && page.awayName === pair.away
  const swapped = page.homeName === pair.away && page.awayName === pair.home
  if (!straight && !swapped) return `match ${base.id}: page teams "${page.homeName}"/"${page.awayName}" do not fit the card`
  const [hg, ag] = straight ? [page.homeGoals, page.awayGoals] : [page.awayGoals, page.homeGoals]
  const [hs, as] = straight ? [page.homeScorers, page.awayScorers] : [page.awayScorers, page.homeScorers]
  const hasScore = hg !== null && ag !== null
  // Never replace a known score with "no score" (markup change or a blanked page).
  if (!hasScore && prev?.status === 'played') return reusePrevious(base, prev)
  return {
    ...base,
    venue: page.venue ?? base.venue,
    kickoff: (page.kickoff && budapestLocalToUtc(page.kickoff)) ?? base.kickoff,
    homeGoals: hasScore ? hg : null,
    awayGoals: hasScore ? ag : null,
    status: hasScore ? 'played' : base.status,
    scorers: [...scorersFor(hs, pair.homeId), ...scorersFor(as, pair.awayId)],
    detailFetchedAt: detail.fetchedAt,
  }
}

function reusePrevious(base: Match, prev: Match | undefined): Match {
  if (!prev?.detailFetchedAt) return base
  const { homeGoals, awayGoals, scorers, detailFetchedAt, status } = prev
  return { ...base, homeGoals, awayGoals, scorers, detailFetchedAt, status: status === 'played' ? 'played' : base.status }
}

function baseMatch(card: FixtureCard, pair: Pair, input: BuildInput): Match {
  const kickoff = card.kickoff ? budapestLocalToUtc(card.kickoff) : null
  const id =
    card.matchId !== null
      ? String(card.matchId)
      : `x-${input.seasonId}-${input.league}-${(kickoff ?? 'tbd').replace(/\D/g, '').slice(0, 12)}-${slug(pair.home)}-${slug(pair.away)}`
  const future = kickoff !== null && Date.parse(kickoff) > input.now.getTime()
  return {
    id,
    siteId: card.matchId,
    homeTeamId: pair.homeId,
    awayTeamId: pair.awayId,
    kickoff,
    venue: card.venue,
    homeGoals: null,
    awayGoals: null,
    status: future ? 'scheduled' : 'unknown',
    scorers: null,
    detailFetchedAt: null,
  }
}

/** Turns one parsed standings page (+ fetched match pages) into the league file. */
export function buildLeagueFile(input: BuildInput): { file: LeagueFile; skipped: string[] } {
  const { page, previous } = input
  const skipped = [...page.skipped]
  const previousIds = new Map((previous?.teams ?? []).map((t) => [t.name, t.id]))
  const teams = page.rows.map((r) => teamFor(r, previousIds))
  const idByName = new Map(teams.map((t) => [t.name, t.id]))
  const names = teams.map((t) => t.name)
  const prevById = new Map((previous?.matches ?? []).map((m) => [m.id, m]))
  const matches = new Map<string, Match>()

  for (const card of page.rows.flatMap((r) => r.cards)) {
    const split = splitTeams(card.teams, names)
    if (!split) {
      skipped.push(`card "${card.teams}": teams not in the league table`)
      continue
    }
    const [home, away] = split
    const pair: Pair = { home, away, homeId: idByName.get(home) ?? '', awayId: idByName.get(away) ?? '' }
    const base = baseMatch(card, pair, input)
    if (matches.has(base.id)) continue
    const detail = card.matchId === null ? undefined : input.details.get(card.matchId)
    const prev = prevById.get(base.id)
    const merged = detail ? applyDetail(base, pair, detail, prev) : reusePrevious(base, prev)
    if (typeof merged === 'string') {
      skipped.push(merged)
      matches.set(base.id, reusePrevious(base, prev))
    } else matches.set(base.id, merged)
  }

  const file: LeagueFile = {
    schemaVersion: SCHEMA_VERSION,
    seasonId: input.seasonId,
    league: input.league,
    sourceUrl: input.sourceUrl,
    teams,
    standings: page.rows.map((r, i) => ({
      position: r.position,
      teamId: teams[i]?.id ?? '',
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDiff: r.goalDiff,
      points: r.points,
      markers: r.markers,
    })),
    matches: [...matches.values()].sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? '')),
    summaries: page.rows.map((r, i) => ({ teamId: teams[i]?.id ?? '', ...r.summary })),
  }
  return { file, skipped }
}
