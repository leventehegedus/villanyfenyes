import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchLeaderboard, fetchLeague, fetchMeta, fetchSeasons, fetchTeam } from '@/lib/data'

export const useMeta = () => useQuery({ queryKey: ['meta'], queryFn: () => fetchMeta() })

export const useSeasons = () => useQuery({ queryKey: ['seasons'], queryFn: () => fetchSeasons() })

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

export const useTeamAllTime = (teamId: string | undefined) =>
  useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeam(teamId ?? ''),
    enabled: teamId !== undefined,
    staleTime: 10 * 60_000,
    retry: false,
  })

export const useLeaderboard = () => useQuery({ queryKey: ['leaderboard'], queryFn: () => fetchLeaderboard(), staleTime: 10 * 60_000 })
