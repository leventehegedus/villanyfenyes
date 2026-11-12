import type { LeagueFile } from '../../src/lib/schema.ts'
import type { ParsedStandingsPage } from './parse-standings.ts'

/** Errors that mean the page is not the standings page we asked for. Empty tables are not errors. */
export function pageGate(page: ParsedStandingsPage, seasonId: number, league: string): string[] {
  const where = `${seasonId}/${league}`
  return [
    page.seasons.length === 0 && `${where}: season selector missing`,
    page.selectedSeasonId !== null && page.selectedSeasonId !== seasonId && `${where}: site served season ${page.selectedSeasonId}`,
    page.selectedLeague !== null && page.selectedLeague !== league && `${where}: site served league ${page.selectedLeague}`,
  ].filter((e): e is string => typeof e === 'string')
}

/** Errors when the new file has far fewer rows than the previous one. */
export function dropGate(previous: LeagueFile | null, next: LeagueFile, maxDrop = 0.3): string[] {
  if (!previous) return []
  const counts = { teams: [previous.teams.length, next.teams.length], matches: [previous.matches.length, next.matches.length] }
  return Object.entries(counts)
    .filter(([, [before = 0, after = 0]]) => before > 0 && after < before * (1 - maxDrop))
    .map(([what, [before, after]]) => `${next.league}: ${what} dropped from ${before} to ${after}`)
}
