import type { ReactNode } from 'react'
import { MatchFilters } from '@/components/MatchFilters'
import { MatchList } from '@/components/MatchList'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'
import { useFavourites, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import type { MessageKey } from '@/i18n/dict'
import type { LeagueData } from '@/lib/data'
import { filterMatches } from '@/lib/schedule'
import type { Match } from '@/lib/schema'
import type { StatusFilter } from '@/lib/schedule'
import { readMatchFilters } from '@/lib/url-state'

type Props = {
  title: MessageKey
  defaultStatus: StatusFilter
  showStatus: boolean
  newestFirst: boolean
  scrollToCurrent?: boolean
  actions?: (matches: Match[], data: LeagueData) => ReactNode
}

/** Shared page body for the schedule and results views: picker, URL filters, grouped list. */
export function MatchesView({ title, defaultStatus, showStatus, newestFirst, scrollToCurrent, actions }: Props) {
  const t = useT()
  const { favourites } = useFavourites()
  const { query, teamName, keep, params, setSelection, seasonId, league, noData } = useLeagueData()
  const filters = readMatchFilters(params, defaultStatus)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t(title)}</h1>
        <SeasonLeaguePicker />
      </div>
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          const matches = filterMatches(data.matches, {
            teamId: filters.teamId,
            status: filters.status,
            favourites: filters.favOnly ? new Set(favourites) : null,
          })
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MatchFilters teams={data.teams} value={filters} showStatus={showStatus} onChange={(extra) => setSelection({ extra })} />
                {actions?.(matches, data)}
              </div>
              {matches.length === 0 ? (
                <EmptyState>{t('emptyFilter')}</EmptyState>
              ) : (
                <MatchList matches={matches} teamName={teamName} keep={keep} newestFirst={newestFirst} scrollToCurrent={scrollToCurrent} />
              )}
            </>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
