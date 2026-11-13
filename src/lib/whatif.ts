import type { Match, StandingRow, Team } from './schema'
import { computeTotals, isPlayed, rankByRules } from './standings'

/** Entered scores for matches without a stored result: match id -> [home, away]. */
export type WhatIf = Map<string, [number, number]>

const ENTRY = /^(.+):(\d{1,2})-(\d{1,2})$/

/** "?w=107:2-1,108:0-0" -> map; malformed entries are dropped. */
export function parseWhatIf(raw: string | null): WhatIf {
  const out: WhatIf = new Map()
  for (const part of (raw ?? '').split(',')) {
    const m = ENTRY.exec(part)
    if (m?.[1]) out.set(m[1], [Number(m[2]), Number(m[3])])
  }
  return out
}

export const serialiseWhatIf = (w: WhatIf): string => [...w].map(([id, [h, a]]) => `${id}:${h}-${a}`).join(',')

/** Stored results stay as they are; entered scores fill only matches without one. */
export function applyWhatIf(matches: readonly Match[], w: WhatIf): Match[] {
  return matches.map((m) => {
    const score = w.get(m.id)
    return score && !isPlayed(m) ? { ...m, status: 'played', homeGoals: score[0], awayGoals: score[1] } : m
  })
}

/** Table after the entered results, ranked by the league rules, with the change against the site order. */
export function whatIfTable(teams: readonly Team[], matches: readonly Match[], current: readonly StandingRow[], w: WhatIf) {
  const applied = applyWhatIf(matches, w)
  const ids = teams.map((t) => t.id)
  const totals = computeTotals(ids, applied)
  const was = new Map(current.map((r) => [r.teamId, r.position]))
  return rankByRules(ids, applied).map((teamId, i) => {
    const t = totals.get(teamId)
    return {
      teamId,
      position: i + 1,
      change: (was.get(teamId) ?? i + 1) - (i + 1),
      played: t?.played ?? 0,
      goalDiff: t?.goalDiff ?? 0,
      points: t?.points ?? 0,
    }
  })
}
