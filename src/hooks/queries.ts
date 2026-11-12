import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchHallOfFame, fetchLeague, fetchMeta, fetchSeasons } from '@/lib/data'

export const useMeta = () => useQuery({ queryKey: ['meta'], queryFn: () => fetchMeta() })

export const useSeasons = () => useQuery({ queryKey: ['seasons'], queryFn: () => fetchSeasons() })

export const useHallOfFame = () => useQuery({ queryKey: ['hall-of-fame'], queryFn: () => fetchHallOfFame() })

export function useLeague(seasonId: number | null, league: string | null, isCurrent: boolean) {
  return useQuery({
    queryKey: ['league', seasonId, league],
    queryFn: () => fetchLeague(seasonId ?? 0, league ?? ''),
    enabled: seasonId !== null && league !== null,
    // Past seasons do not change; the current one changes only when the ingest runs.
    staleTime: isCurrent ? 10 * 60_000 : Infinity,
    gcTime: isCurrent ? 60 * 60_000 : 24 * 60 * 60_000,
    placeholderData: keepPreviousData,
  })
}
