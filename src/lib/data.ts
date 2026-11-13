import type { ZodType } from 'zod'
import { DATA_BASE } from './config'
import { LeaderboardFileRead, LeagueFileRead, MetaFile, SeasonsFile, TeamAllTimeFileRead } from './schema'

export class DataError extends Error {
  constructor(
    message: string,
    /** True when the file does not exist yet (no ingest has run), not a network or format problem. */
    readonly missing = false,
  ) {
    super(message)
  }
}

type Fetcher = (url: string) => Promise<Response>

async function fetchJson<T>(path: string, schema: ZodType<T>, fetcher: Fetcher): Promise<T> {
  const res = await fetcher(`${DATA_BASE}/${path}`)
  // Dev servers and SPA hosts answer a missing file with index.html, so check the type too.
  const isHtml = res.headers.get('content-type')?.includes('text/html') ?? false
  if (res.status === 404 || isHtml) throw new DataError(`Missing ${path}`, true)
  if (!res.ok) throw new DataError(`HTTP ${res.status} for ${path}`)
  const parsed = schema.safeParse(await res.json().catch(() => null))
  if (!parsed.success) throw new DataError(`Unexpected data in ${path}`)
  return parsed.data
}

const browserFetch: Fetcher = (url) => fetch(url)

export const fetchMeta = (f: Fetcher = browserFetch) => fetchJson('meta.json', MetaFile, f)
export const fetchSeasons = (f: Fetcher = browserFetch) => fetchJson('seasons.json', SeasonsFile, f)
export const fetchLeague = (seasonId: number, league: string, f: Fetcher = browserFetch) =>
  fetchJson(`${seasonId}/${league}.json`, LeagueFileRead, f)

export type LeagueData = Awaited<ReturnType<typeof fetchLeague>>
export const fetchTeam = (teamId: string, f: Fetcher = browserFetch) =>
  fetchJson(`teams/${encodeURIComponent(teamId)}.json`, TeamAllTimeFileRead, f)
export type TeamAllTimeData = Awaited<ReturnType<typeof fetchTeam>>
export const fetchLeaderboard = (f: Fetcher = browserFetch) => fetchJson('leaderboard.json', LeaderboardFileRead, f)
