import type { SortDir } from './filters'
import type { StatusFilter } from './schedule'

export type MatchFilterState = { teamId: string | null; status: StatusFilter; favOnly: boolean }

/** Shared match filters from URL params (t = team, st = status, fav = 1). */
export function readMatchFilters(params: URLSearchParams, defaultStatus: StatusFilter): MatchFilterState {
  const st = params.get('st')
  return {
    teamId: params.get('t'),
    status: st === 'all' || st === 'past' || st === 'upcoming' ? st : defaultStatus,
    favOnly: params.get('fav') === '1',
  }
}

export const STANDINGS_SORT_KEYS = ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDiff', 'points'] as const
export type StandingsSortKey = (typeof STANDINGS_SORT_KEYS)[number]
export type StandingsSort = { key: StandingsSortKey | 'position'; dir: SortDir }

const isSortKey = (v: string | undefined): v is StandingsSortKey =>
  STANDINGS_SORT_KEYS.some((k) => k === v)

/** Standings sort from "?o=points:desc"; anything else means the site's own order. */
export function parseStandingsSort(raw: string | null): StandingsSort {
  const [key, dir] = (raw ?? '').split(':')
  return isSortKey(key) && (dir === 'asc' || dir === 'desc') ? { key, dir } : { key: 'position', dir: 'asc' }
}

export const MAX_HIGHLIGHT = 4

/** Highlighted chart teams from "?h=1,2" (unknown ids dropped); `fallback` when the param is absent. */
export function readHighlight(raw: string | null, teamIds: readonly string[], fallback: readonly string[]): string[] {
  if (raw === null) return fallback.slice(0, MAX_HIGHLIGHT)
  return raw
    .split(',')
    .filter((id) => teamIds.includes(id))
    .slice(0, MAX_HIGHLIGHT)
}

/** Adds or removes a team; when full, the oldest highlight makes room. */
export function toggleHighlight(current: readonly string[], id: string): string[] {
  if (current.includes(id)) return current.filter((x) => x !== id)
  return [...current, id].slice(-MAX_HIGHLIGHT)
}
