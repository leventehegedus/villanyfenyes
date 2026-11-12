import { z } from 'zod'

/** Bump when the shape of the files in public/data changes incompatibly. */
export const SCHEMA_VERSION = 1

export const LEAGUE_CODE = /^L[1-5][A-H]?$/
export const LeagueCode = z.string().regex(LEAGUE_CODE)

export const Half = z.enum(['tavasz', 'nyar', 'osz', 'unknown'])

export const Season = z.object({
  id: z.number().int(),
  label: z.string().min(1),
  year: z.number().int().nullable(),
  half: Half,
  start: z.string().nullable(),
  end: z.string().nullable(),
})

export const Team = z.object({
  id: z.string().min(1),
  siteId: z.number().int().nullable(),
  name: z.string().min(1),
})

export const Marker = z.enum([
  'promotion',
  'relegation',
  'winStreak',
  'lossStreak',
  'manyGoals',
  'fewConceded',
])

export const StandingRow = z.object({
  position: z.number().int().positive(),
  teamId: z.string().min(1),
  played: z.number().int().nonnegative(),
  won: z.number().int().nonnegative(),
  drawn: z.number().int().nonnegative(),
  lost: z.number().int().nonnegative(),
  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),
  goalDiff: z.number().int(),
  points: z.number().int(),
  markers: z.array(Marker),
})

export const Scorer = z.object({
  name: z.string().min(1),
  teamId: z.string().min(1),
  goals: z.number().int().positive(),
})

export const MatchStatus = z.enum(['scheduled', 'played', 'unknown'])

export const Match = z.object({
  id: z.string().min(1),
  siteId: z.number().int().nullable(),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  /** UTC ISO timestamp; the site publishes Europe/Budapest wall time. */
  kickoff: z.string().nullable(),
  venue: z.string().nullable(),
  homeGoals: z.number().int().nonnegative().nullable(),
  awayGoals: z.number().int().nonnegative().nullable(),
  status: MatchStatus,
  /** null = match page not fetched or not available; [] = page fetched, nobody scored. */
  scorers: z.array(Scorer).nullable(),
  /** When the match page was last fetched (UTC ISO), null if never. */
  detailFetchedAt: z.string().nullable(),
})

export const TeamSummary = z.object({
  teamId: z.string().min(1),
  bestLeague: z.string().nullable(),
  topScorer: z.object({ name: z.string(), goals: z.number().int() }).nullable(),
  seasonsCount: z.number().int().nullable(),
  matchesPlayed: z.number().int().nullable(),
})

/** Keeps valid items and silently drops the rest (read side only). */
const tolerantArray = <T extends z.ZodType>(item: T) =>
  z.array(z.unknown()).transform((items) =>
    items.flatMap((raw) => {
      const parsed = item.safeParse(raw)
      return parsed.success ? [parsed.data as z.output<T>] : []
    }),
  )

const leagueFileShape = <A extends 'strict' | 'tolerant'>(mode: A) => {
  const arr = <T extends z.ZodType>(item: T) =>
    mode === 'strict' ? z.array(item) : tolerantArray(item)
  return z.object({
    schemaVersion: z.number().int(),
    seasonId: z.number().int(),
    league: LeagueCode,
    sourceUrl: z.string().url(),
    teams: arr(Team),
    standings: arr(StandingRow),
    matches: arr(Match),
    summaries: arr(TeamSummary),
  })
}

export const LeagueFile = leagueFileShape('strict')
export const LeagueFileRead = leagueFileShape('tolerant')

export const SeasonsFile = z.object({
  schemaVersion: z.number().int(),
  currentSeasonId: z.number().int(),
  seasons: z.array(Season),
  /** Leagues with ingested data, keyed by season id. */
  leagues: z.record(z.string(), z.array(LeagueCode)),
})

export const HallOfFameTable = z.object({
  key: z.string(),
  title: z.string(),
  kind: z.enum(['team', 'player']),
  metric: z.enum(['seasons', 'goals', 'wins', 'firstSeason', 'unknown']),
  rows: z.array(z.object({ name: z.string(), value: z.string() })),
})

export const HallOfFameFile = z.object({
  schemaVersion: z.number().int(),
  sourceUrl: z.string().url(),
  tables: z.array(HallOfFameTable),
})

export const Mismatch = z.object({
  seasonId: z.number().int(),
  league: z.string(),
  teamId: z.string(),
  field: z.string(),
  site: z.number(),
  computed: z.number(),
})

export const MetaFile = z.object({
  schemaVersion: z.number().int(),
  generatedAt: z.string(),
  sourceBase: z.string().url(),
  requests: z.number().int().nonnegative(),
  skippedRows: z.object({ count: z.number().int().nonnegative(), reasons: z.array(z.string()) }),
  warnings: z.array(z.string()),
  mismatches: z.array(Mismatch),
  pendingMatchDetails: z.number().int().nonnegative(),
})

export type Season = z.infer<typeof Season>
export type Team = z.infer<typeof Team>
export type Marker = z.infer<typeof Marker>
export type StandingRow = z.infer<typeof StandingRow>
export type Scorer = z.infer<typeof Scorer>
export type MatchStatus = z.infer<typeof MatchStatus>
export type Match = z.infer<typeof Match>
export type TeamSummary = z.infer<typeof TeamSummary>
export type LeagueFile = z.infer<typeof LeagueFile>
export type SeasonsFile = z.infer<typeof SeasonsFile>
export type HallOfFameTable = z.infer<typeof HallOfFameTable>
export type HallOfFameFile = z.infer<typeof HallOfFameFile>
export type Mismatch = z.infer<typeof Mismatch>
export type MetaFile = z.infer<typeof MetaFile>
