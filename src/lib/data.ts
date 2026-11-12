import type { ZodType } from 'zod'
import { DATA_BASE } from './config'
import { HallOfFameFile, LeagueFileRead, MetaFile, SeasonsFile } from './schema'

export class DataError extends Error {}

type Fetcher = (url: string) => Promise<Response>

async function fetchJson<T>(path: string, schema: ZodType<T>, fetcher: Fetcher): Promise<T> {
  const res = await fetcher(`${DATA_BASE}/${path}`)
  if (!res.ok) throw new DataError(`HTTP ${res.status} for ${path}`)
  const parsed = schema.safeParse(await res.json().catch(() => null))
  if (!parsed.success) throw new DataError(`Unexpected data in ${path}`)
  return parsed.data
}

const browserFetch: Fetcher = (url) => fetch(url)

export const fetchMeta = (f: Fetcher = browserFetch) => fetchJson('meta.json', MetaFile, f)
export const fetchSeasons = (f: Fetcher = browserFetch) => fetchJson('seasons.json', SeasonsFile, f)
export const fetchHallOfFame = (f: Fetcher = browserFetch) => fetchJson('hall-of-fame.json', HallOfFameFile, f)
export const fetchLeague = (seasonId: number, league: string, f: Fetcher = browserFetch) =>
  fetchJson(`${seasonId}/${league}.json`, LeagueFileRead, f)

export type LeagueData = Awaited<ReturnType<typeof fetchLeague>>
