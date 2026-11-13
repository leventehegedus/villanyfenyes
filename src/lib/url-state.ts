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

/** The podium (top 3) can always be highlighted; at most this many other teams on top. */
export const MAX_EXTRA_HIGHLIGHT = 2
const MAX_HIGHLIGHT = 3 + MAX_EXTRA_HIGHLIGHT

/** URL value for "nothing highlighted" (an empty param would mean "use the default"). */
export const NO_HIGHLIGHT = '-'

/** Highlighted chart teams from "?h=1,2" (unknown ids dropped); `fallback` when the param is absent. */
export function readHighlight(raw: string | null, teamIds: readonly string[], fallback: readonly string[]): string[] {
  if (raw === null) return fallback.slice(0, MAX_HIGHLIGHT)
  return raw
    .split(',')
    .filter((id) => teamIds.includes(id))
    .slice(0, MAX_HIGHLIGHT)
}

export const writeHighlight = (ids: readonly string[]): string => (ids.length === 0 ? NO_HIGHLIGHT : ids.join(','))

/** Adds or removes a team; when the non-podium slots are full, the oldest of those makes room. */
export function toggleHighlight(current: readonly string[], id: string, podium: readonly string[]): string[] {
  if (current.includes(id)) return current.filter((x) => x !== id)
  const next = [...current, id]
  const extras = next.filter((x) => !podium.includes(x))
  const drop = extras.slice(0, Math.max(0, extras.length - MAX_EXTRA_HIGHLIGHT))
  return next.filter((x) => !drop.includes(x))
}
