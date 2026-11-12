import { LeagueFile, SCHEMA_VERSION, SeasonsFile } from '../../src/lib/schema.ts'
import type { Match, MetaFile, Mismatch } from '../../src/lib/schema.ts'
import { isEnabledLeague } from '../../src/lib/leagues.ts'
import { compareWithSite, orderDiffers } from '../../src/lib/standings.ts'
import { BudgetExceeded } from './fetch.ts'
import { dropGate, pageGate } from './gates.ts'
import { buildLeagueFile, needsDetail, splitTeams } from './normalise.ts'
import type { MatchDetail } from './normalise.ts'
import { parseMatchPage } from './parse-match.ts'
import { parseStandingsPage } from './parse-standings.ts'
import type { ParsedStandingsPage } from './parse-standings.ts'
import { budapestLocalToUtc } from '../../src/lib/time.ts'

export const SITE = 'https://villanyfenyesbajnoksag.hu'

export type Source = { get(path: string): Promise<string> }

export type RunOptions = {
  seasonId?: number
  leagues?: string[]
  now: Date
  previousLeague: (seasonId: number, league: string) => LeagueFile | null
  previousSeasons: SeasonsFile | null
}

export type RunResult = {
  errors: string[]
  /** Path relative to the data dir -> JSON value. */
  files: Map<string, unknown>
  report: Omit<MetaFile, 'generatedAt' | 'schemaVersion' | 'sourceBase' | 'requests'>
}

export const standingsPath = (seasonId: number, league: string) =>
  `/tabella?selected_season=${seasonId}&league=${league}`

type Candidate = { matchId: number; path: string; seen: boolean; kickoff: string | null }

/** Linked matches whose page should be fetched, never-seen first, then newest first. */
function detailCandidates(page: ParsedStandingsPage, prev: LeagueFile | null, now: Date): Candidate[] {
  const prevById = new Map<string, Match>((prev?.matches ?? []).map((m) => [m.id, m]))
  const names = page.rows.map((r) => r.name)
  const out = new Map<number, Candidate>()
  for (const card of page.rows.flatMap((r) => r.cards)) {
    if (card.matchId === null || out.has(card.matchId) || !splitTeams(card.teams, names)) continue
    const kickoff = card.kickoff ? budapestLocalToUtc(card.kickoff) : null
    const before = prevById.get(String(card.matchId))
    if (!needsDetail(before, kickoff, now)) continue
    out.set(card.matchId, {
      matchId: card.matchId,
      path: `/tabella/${card.matchId}/eredmenyek/${card.ownerTeamId}`,
      seen: Boolean(before?.detailFetchedAt),
      kickoff,
    })
  }
  return [...out.values()]
}

export async function runIngest(source: Source, opts: RunOptions): Promise<RunResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const skippedReasons: string[] = []
  const mismatches: Mismatch[] = []
  const files = new Map<string, unknown>()

  // 1. Entry page: season list, league list and (for the default season) the L1 table.
  const entryPath = opts.seasonId === undefined ? '/tabella' : standingsPath(opts.seasonId, 'L1')
  const entry = parseStandingsPage(await source.get(entryPath))
  const seasonId = opts.seasonId ?? entry.selectedSeasonId
  if (seasonId === null || entry.seasons.length === 0) {
    return { errors: ['entry page: no season selector'], files, report: emptyReport() }
  }
  const refused = (opts.leagues ?? []).filter((l) => !isEnabledLeague(l))
  if (refused.length > 0) {
    return { errors: refused.map((l) => `league ${l} is not enabled (see src/lib/leagues.ts)`), files, report: emptyReport() }
  }
  const leagues = (opts.leagues ?? entry.leagues).filter(isEnabledLeague)

  // 2. All standings pages first, so the request budget never starves them.
  const pages = new Map<string, ParsedStandingsPage>()
  for (const league of leagues) {
    const page = league === 'L1' ? entry : parseStandingsPage(await source.get(standingsPath(seasonId, league)))
    const gate = pageGate(page, seasonId, league)
    if (gate.length > 0) errors.push(...gate)
    else if (page.rows.length === 0) {
      const hadTeams = (opts.previousLeague(seasonId, league)?.teams.length ?? 0) > 0
      ;(hadTeams ? errors : warnings).push(`${seasonId}/${league}: empty table${hadTeams ? ' but the previous file had teams' : ', skipped'}`)
    }
    else pages.set(league, page)
  }
  if (pages.size === 0 && errors.length === 0) errors.push(`${seasonId}: no league has standings rows`)

  // 3. Match pages within the remaining budget.
  const candidates = [...pages].flatMap(([league, page]) =>
    detailCandidates(page, opts.previousLeague(seasonId, league), opts.now),
  )
  candidates.sort((a, b) => Number(a.seen) - Number(b.seen) || (b.kickoff ?? '').localeCompare(a.kickoff ?? ''))
  const details = new Map<number, MatchDetail>()
  let pending = 0
  for (const [i, c] of candidates.entries()) {
    try {
      details.set(c.matchId, { page: parseMatchPage(await source.get(c.path)), fetchedAt: opts.now.toISOString() })
    } catch (err) {
      if (err instanceof BudgetExceeded) {
        pending = candidates.length - i
        break
      }
      warnings.push(`match ${c.matchId}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 4. Build, validate and gate each league file.
  for (const [league, page] of pages) {
    const previous = opts.previousLeague(seasonId, league)
    const { file, skipped } = buildLeagueFile({
      seasonId,
      league,
      sourceUrl: `${SITE}${standingsPath(seasonId, league)}`,
      page,
      details,
      previous,
      now: opts.now,
    })
    skippedReasons.push(...skipped.map((s) => `${seasonId}/${league}: ${s}`))
    const valid = LeagueFile.safeParse(file)
    if (!valid.success) {
      errors.push(`${seasonId}/${league}: schema validation failed: ${valid.error.issues[0]?.message ?? ''}`)
      continue
    }
    errors.push(...dropGate(previous, file))
    mismatches.push(...compareWithSite(seasonId, league, file.standings, file.matches))
    if (orderDiffers(file.standings, file.matches)) warnings.push(`${seasonId}/${league}: site order differs from the tie-break rules`)
    files.set(`${seasonId}/${league}.json`, file)
  }

  const prevLeagues = opts.previousSeasons?.leagues ?? {}
  files.set(
    'seasons.json',
    SeasonsFile.parse({
      schemaVersion: SCHEMA_VERSION,
      currentSeasonId: opts.seasonId === undefined ? seasonId : (opts.previousSeasons?.currentSeasonId ?? seasonId),
      seasons: entry.seasons,
      leagues: Object.fromEntries(
        Object.entries({ ...prevLeagues, [String(seasonId)]: [...(prevLeagues[String(seasonId)] ?? []), ...pages.keys()] }).map(
          ([id, codes]) => [id, [...new Set(codes)].filter(isEnabledLeague)],
        ),
      ),
    }),
  )

  return {
    errors,
    files,
    report: {
      skippedRows: { count: skippedReasons.length, reasons: skippedReasons.slice(0, 50) },
      warnings: warnings.slice(0, 100),
      mismatches,
      pendingMatchDetails: pending,
    },
  }
}

const emptyReport = (): RunResult['report'] => ({
  skippedRows: { count: 0, reasons: [] },
  warnings: [],
  mismatches: [],
  pendingMatchDetails: 0,
})
