import { MatchFilters } from '@/components/MatchFilters'
import { MatchList } from '@/components/MatchList'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { filterMatches } from '@/lib/schedule'
import { readMatchFilters } from '@/lib/url-state'

export default function SchedulePage() {
  const t = useT()
  const { query, teamName, keep, params, setSelection, seasonId, league, noData } = useLeagueData()
  const filters = readMatchFilters(params, 'upcoming')

  return (
    <div className="space-y-4">
      <PageHeader title={t('navSchedule')} />
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          const matches = filterMatches(data.matches, filters)
          return (
            <>
              <MatchFilters teams={data.teams} value={filters} onChange={(extra) => setSelection({ extra })} />
              {matches.length === 0 ? (
                <EmptyState>{t('emptyFilter')}</EmptyState>
              ) : (
                <MatchList matches={matches} teamName={teamName} keep={keep} newestFirst={filters.status === 'past'} scrollToCurrent={filters.status === 'all'} />
              )}
            </>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
