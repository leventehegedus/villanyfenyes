import { useMemo } from 'react'
import { useLeague } from './queries'
import { useSelection } from './useSelection'

/** Selection + league query + team name lookup: the data most pages need. */
export function useLeagueData() {
  const selection = useSelection()
  const query = useLeague(selection.seasonId, selection.league, selection.isCurrent)
  const teams = query.data?.teams
  const teamName = useMemo(() => {
    const names = new Map((teams ?? []).map((t) => [t.id, t.name]))
    return (id: string) => names.get(id) ?? id
  }, [teams])
  return { ...selection, query, data: query.data, teamName }
}
