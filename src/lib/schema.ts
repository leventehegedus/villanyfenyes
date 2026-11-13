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

type Mode = 'strict' | 'tolerant'
const arrayFor =
  (mode: Mode) =>
  <T extends z.ZodType>(item: T) =>
    mode === 'strict' ? z.array(item) : tolerantArray(item)

const leagueFileShape = (mode: Mode) => {
  const arr = arrayFor(mode)
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

const count = z.number().int().nonnegative()

export const AllTimeTotals = z.object({
  played: count,
  won: count,
  drawn: count,
  lost: count,
  goalsFor: count,
  goalsAgainst: count,
  points: count,
})

/** One played match from the team's point of view, with where to find it. */
export const MatchRef = z.object({
  seasonId: z.number().int(),
  league: LeagueCode,
  matchId: z.string().min(1),
  kickoff: z.string().nullable(),
  opponentId: z.string().min(1),
  goalsFor: count,
  goalsAgainst: count,
})

const Streak = z.object({ length: z.number().int().positive(), from: MatchRef, to: MatchRef })

const teamAllTimeShape = (mode: Mode) => {
  const arr = arrayFor(mode)
  return z.object({
    schemaVersion: z.number().int(),
    teamId: z.string().min(1),
    /** Every name the site used for the team, latest first. */
    names: z.array(z.string().min(1)).min(1),
    /** Newest season first. */
    seasons: arr(
      z.object({
        seasonId: z.number().int(),
        label: z.string().min(1),
        league: LeagueCode,
        /** False for the current season: excluded from honours and best/worst season. */
        finished: z.boolean(),
        position: z.number().int().positive().nullable(),
        teamsInLeague: count,
        marker: z.enum(['promotion', 'relegation']).nullable(),
        totals: AllTimeTotals,
      }),
    ),
    opponents: arr(z.object({ teamId: z.string().min(1), name: z.string().min(1), totals: AllTimeTotals })),
    records: z.object({
      biggestWin: MatchRef.nullable(),
      biggestDefeat: MatchRef.nullable(),
      highestScoring: MatchRef.nullable(),
    }),
    streaks: z.object({ win: Streak.nullable(), unbeaten: Streak.nullable(), loss: Streak.nullable() }),
    cleanSheets: count,
    failedToScore: count,
    scorers: z.object({
      playedMatches: count,
      /** Played matches whose scorers are known; the rest are "nincs adat", not zero. */
      coveredMatches: count,
      rows: arr(
        z.object({ name: z.string().min(1), goals: z.number().int().positive(), matches: z.number().int().positive(), hatTricks: count }),
      ),
    }),
  })
}

export const TeamAllTimeFile = teamAllTimeShape('strict')
export const TeamAllTimeFileRead = teamAllTimeShape('tolerant')

export const SeasonsFile = z.object({
  schemaVersion: z.number().int(),
  currentSeasonId: z.number().int(),
  seasons: z.array(Season),
  /** Leagues with ingested data, keyed by season id. */
  leagues: z.record(z.string(), z.array(LeagueCode)),
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
export type Mismatch = z.infer<typeof Mismatch>
export type MetaFile = z.infer<typeof MetaFile>
export type AllTimeTotals = z.infer<typeof AllTimeTotals>
export type MatchRef = z.infer<typeof MatchRef>
export type TeamAllTimeFile = z.infer<typeof TeamAllTimeFile>
