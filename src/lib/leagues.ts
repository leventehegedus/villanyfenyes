/**
 * Leagues the ingest may fetch and the app lists. Only L1 for now (owner's decision, 2026-11-13);
 * add codes here to enable more.
 */
export const ENABLED_LEAGUES: readonly string[] = ['L1']

export const isEnabledLeague = (code: string) => ENABLED_LEAGUES.includes(code)
