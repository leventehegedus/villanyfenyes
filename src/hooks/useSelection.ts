import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { usePrefs } from './prefs'
import { useSeasons } from './queries'

/** Season and league from the URL (?s=55&l=L1), falling back to saved defaults and the current season. */
export function useSelection() {
  const [params, setParams] = useSearchParams()
  const seasons = useSeasons()
  const { prefs } = usePrefs()
  const data = seasons.data

  const fromUrl = Number(params.get('s'))
  const seasonId = (Number.isInteger(fromUrl) && fromUrl > 0 ? fromUrl : null) ?? prefs.defaultSeason ?? data?.currentSeasonId ?? null
  const leagues = (seasonId !== null && data?.leagues[String(seasonId)]) || []
  const wanted = params.get('l') ?? prefs.defaultLeague ?? 'L1'
  const noData = data !== undefined && leagues.length === 0
  const league = noData ? null : leagues.length === 0 || leagues.includes(wanted) ? wanted : (leagues[0] ?? null)
  const season = data?.seasons.find((s) => s.id === seasonId) ?? null

  const setSelection = useCallback(
    (next: { s?: number; l?: string; extra?: Record<string, string | null> }) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next.s !== undefined) p.set('s', String(next.s))
          if (next.l !== undefined) p.set('l', next.l)
          for (const [k, v] of Object.entries(next.extra ?? {})) {
            if (v === null || v === '') p.delete(k)
            else p.set(k, v)
          }
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  return {
    seasons,
    season,
    seasonId,
    league,
    leagues,
    isCurrent: seasonId !== null && seasonId === data?.currentSeasonId,
    /** True when seasons.json is loaded and lists no data for the selected season. */
    noData,
    params,
    setSelection,
    /** Query string that keeps the selection when linking to another page. */
    keep: seasonId !== null && league ? `?s=${seasonId}&l=${league}` : '',
  }
}
