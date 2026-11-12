import type { Match } from './schema'
import { isPlayed } from './standings'
import { SITE_TIME_ZONE } from './time'

export type StatusFilter = 'all' | 'played' | 'upcoming'

export type MatchFilter = {
  teamId?: string | null
  status?: StatusFilter
  favourites?: ReadonlySet<string> | null
}

const involves = (m: Match, teamId: string) => m.homeTeamId === teamId || m.awayTeamId === teamId
const byKickoff = (a: Match, b: Match) => (a.kickoff ?? '￿').localeCompare(b.kickoff ?? '￿')

export const isUpcoming = (m: Match, now: Date) =>
  !isPlayed(m) && m.kickoff !== null && Date.parse(m.kickoff) > now.getTime()

export function filterMatches(matches: readonly Match[], f: MatchFilter, now = new Date()): Match[] {
  return matches
    .filter((m) => !f.teamId || involves(m, f.teamId))
    .filter((m) => !f.favourites?.size || [...f.favourites].some((id) => involves(m, id)))
    .filter((m) => (f.status === 'played' ? isPlayed(m) : f.status === 'upcoming' ? isUpcoming(m, now) : true))
    .sort(byKickoff)
}

export const nextMatch = (teamId: string, matches: readonly Match[], now = new Date()): Match | null =>
  filterMatches(matches, { teamId, status: 'upcoming' }, now)[0] ?? null

export const lastResult = (teamId: string, matches: readonly Match[]): Match | null =>
  filterMatches(matches, { teamId, status: 'played' }).at(-1) ?? null

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Monday (YYYY-MM-DD) of the Budapest-local week containing the instant. */
export function weekStart(iso: string): string {
  const parts = dayFormat.formatToParts(new Date(iso))
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  const offset = WEEKDAYS.indexOf(get('weekday'))
  const day = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')) - offset))
  return day.toISOString().slice(0, 10)
}

export type WeekGroup = { week: string | null; matches: Match[] }

/** Groups by Budapest week (the site publishes no rounds); matches without kickoff go last. */
export function groupByWeek(matches: readonly Match[]): WeekGroup[] {
  const groups = new Map<string | null, Match[]>()
  for (const m of [...matches].sort(byKickoff)) {
    const key = m.kickoff ? weekStart(m.kickoff) : null
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  return [...groups].map(([week, ms]) => ({ week, matches: ms }))
}
