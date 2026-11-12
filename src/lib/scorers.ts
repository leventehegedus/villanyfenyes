import type { Match } from './schema'
import { isPlayed } from './standings'

export type ScorerRow = { rank: number; name: string; teamId: string; goals: number; matches: number }

/** Top scorers from per-match scorer data; coverage says how many played matches have it. */
export function aggregateScorers(matches: readonly Match[]) {
  const played = matches.filter(isPlayed)
  const totals = new Map<string, Omit<ScorerRow, 'rank'>>()
  for (const m of played) {
    for (const s of m.scorers ?? []) {
      const key = `${s.teamId}\u0000${s.name}`
      const row = totals.get(key) ?? { name: s.name, teamId: s.teamId, goals: 0, matches: 0 }
      totals.set(key, { ...row, goals: row.goals + s.goals, matches: row.matches + 1 })
    }
  }
  const sorted = [...totals.values()].sort(
    (a, b) => b.goals - a.goals || a.matches - b.matches || a.name.localeCompare(b.name, 'hu'),
  )
  const rows: ScorerRow[] = sorted.map((r, i) => {
    const prev = sorted[i - 1]
    const tied = prev && prev.goals === r.goals && prev.matches === r.matches
    return { ...r, rank: tied ? 0 : i + 1 }
  })
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row && row.rank === 0) row.rank = rows[i - 1]?.rank ?? i + 1
  }
  return {
    rows,
    coverage: { withScorers: played.filter((m) => m.scorers !== null).length, played: played.length },
  }
}
