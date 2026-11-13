import type { Match } from './schema'
import { teamResults } from './stats'


/** A player's team matches (oldest first) with their goals; null where scorers were not collected. */
export function playerLog(teamId: string, name: string, matches: readonly Match[]) {
  const byId = new Map(matches.map((m) => [m.id, m]))
  const entries = teamResults(teamId, matches).map((r) => {
    const scorers = byId.get(r.matchId)?.scorers ?? null
    return { ...r, goals: scorers === null ? null : (scorers.find((s) => s.teamId === teamId && s.name === name)?.goals ?? 0) }
  })
  let run = 0
  let longestStreak = 0
  for (const e of entries) {
    if (e.goals === null) continue
    run = e.goals > 0 ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  return {
    entries,
    goals: entries.reduce((n, e) => n + (e.goals ?? 0), 0),
    matchesScored: entries.filter((e) => (e.goals ?? 0) > 0).length,
    currentStreak: run,
    longestStreak,
  }
}

export type PlayerLog = ReturnType<typeof playerLog>
