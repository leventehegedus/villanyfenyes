import type { SortDir } from './filters'
import type { StatusFilter } from './schedule'

export type MatchFilterState = { teamIds: string[]; status: StatusFilter }

/** Team ids from "?t=69,100"; empty means all teams. */
export const readTeamIds = (params: URLSearchParams): string[] => (params.get('t') ?? '').split(',').filter(Boolean)

/** Schedule filters from URL params (t = teams, st = status). */
export function readMatchFilters(params: URLSearchParams, defaultStatus: StatusFilter): MatchFilterState {
  const st = params.get('st')
  return {
    teamIds: readTeamIds(params),
    status: st === 'all' || st === 'past' || st === 'upcoming' ? st : defaultStatus,
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


/** URL value for "nothing highlighted" (an empty param would mean "use the default"). */
export const NO_HIGHLIGHT = '-'

/** Highlighted chart teams from "?h=1,2" (unknown ids dropped); `fallback` when the param is absent. */
export function readHighlight(raw: string | null, teamIds: readonly string[], fallback: readonly string[]): string[] {
  if (raw === null) return [...fallback]
  return raw
    .split(',')
    .filter((id) => teamIds.includes(id))
}

export const writeHighlight = (ids: readonly string[]): string => (ids.length === 0 ? NO_HIGHLIGHT : ids.join(','))

/** Adds or removes a team; any number can be highlighted. */
export const toggleHighlight = (current: readonly string[], id: string): string[] =>
  current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
