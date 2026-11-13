import { weekStart } from './schedule'
import type { Match } from './schema'
import { isPlayed } from './standings'
import { teamResults } from './stats'

export const playerKey = (teamId: string, name: string) => `${teamId}\u0000${name}`

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

/** Cumulative goals per Budapest week for the `top` scorers (by final goals, then name). */
export function scorerRace(matches: readonly Match[], top = 5) {
  const withScorers = matches.filter((m) => isPlayed(m) && m.scorers !== null && m.kickoff !== null)
  const totals = new Map<string, { key: string; name: string; teamId: string; goals: number }>()
  for (const s of withScorers.flatMap((m) => m.scorers ?? [])) {
    const key = playerKey(s.teamId, s.name)
    const row = totals.get(key) ?? { key, name: s.name, teamId: s.teamId, goals: 0 }
    totals.set(key, { ...row, goals: row.goals + s.goals })
  }
  const players = [...totals.values()].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, 'hu')).slice(0, top)
  const weeks = [...new Set(withScorers.map((m) => weekStart(m.kickoff ?? '')))].sort()
  const running: Record<string, number> = Object.fromEntries(players.map((p) => [p.key, 0]))
  const rows = weeks.map((week) => {
    for (const m of withScorers.filter((x) => weekStart(x.kickoff ?? '') === week)) {
      for (const s of m.scorers ?? []) {
        const key = playerKey(s.teamId, s.name)
        if (key in running) running[key] = (running[key] ?? 0) + s.goals
      }
    }
    return { week, values: { ...running } }
  })
  return { players, weeks, rows }
}
