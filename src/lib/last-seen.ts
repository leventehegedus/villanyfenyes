import { z } from 'zod'
import type { Match } from './schema'
import { isPlayed } from './standings'

export const LastSeenSnapshot = z.object({
  schemaVersion: z.literal(1),
  savedAt: z.string(),
  /** Played match ids per favourite team at the time of the snapshot. */
  seen: z.record(z.string(), z.array(z.string())),
})
export type LastSeenSnapshot = z.infer<typeof LastSeenSnapshot>

const playedFor = (teamId: string, matches: readonly Match[]) =>
  matches.filter((m) => isPlayed(m) && (m.homeTeamId === teamId || m.awayTeamId === teamId))

export function makeSnapshot(favourites: readonly string[], matches: readonly Match[], now: Date): LastSeenSnapshot {
  return {
    schemaVersion: 1,
    savedAt: now.toISOString(),
    seen: Object.fromEntries(favourites.map((id) => [id, playedFor(id, matches).map((m) => m.id)])),
  }
}

/** Played matches of favourites that appeared after the snapshot (teams without a baseline are skipped). */
export function diffSinceSnapshot(
  snapshot: LastSeenSnapshot | null,
  favourites: readonly string[],
  matches: readonly Match[],
) {
  if (!snapshot) return { hasSnapshot: false, since: null, newMatches: [] as Match[] }
  const fresh = new Map<string, Match>()
  for (const id of favourites) {
    const seen = snapshot.seen[id]
    if (!seen) continue
    for (const m of playedFor(id, matches)) if (!seen.includes(m.id)) fresh.set(m.id, m)
  }
  return {
    hasSnapshot: true,
    since: snapshot.savedAt,
    newMatches: [...fresh.values()].sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? '')),
  }
}

/** Updates baselines only for favourites that play in `matches`; other teams keep theirs. */
export function mergeSnapshot(
  previous: LastSeenSnapshot | null,
  favourites: readonly string[],
  matches: readonly Match[],
  now: Date,
): LastSeenSnapshot {
  const present = favourites.filter((id) => matches.some((m) => m.homeTeamId === id || m.awayTeamId === id))
  const fresh = makeSnapshot(present, matches, now)
  return { ...fresh, seen: { ...previous?.seen, ...fresh.seen } }
}
