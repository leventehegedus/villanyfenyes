/**
 * Leagues the ingest may fetch and the app lists. All 19 leagues since 2026-11-20 (owner's decision;
 * L1-only before). Remove codes here to disable some.
 */
export const ENABLED_LEAGUES: readonly string[] = [
  'L1',
  'L2A', 'L2B',
  'L3A', 'L3B', 'L3C', 'L3D',
  'L4A', 'L4B', 'L4C', 'L4D',
  'L5A', 'L5B', 'L5C', 'L5D', 'L5E', 'L5F', 'L5G', 'L5H',
]

export const isEnabledLeague = (code: string) => ENABLED_LEAGUES.includes(code)
