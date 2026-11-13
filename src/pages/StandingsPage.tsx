import { Link } from 'react-router'
import { MatchList } from '@/components/MatchList'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'
import { StandingsTable } from '@/components/StandingsTable'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { filterMatches } from '@/lib/schedule'
import { parseStandingsSort } from '@/lib/url-state'

export default function StandingsPage() {
  const t = useT()
  const { query, teamName, keep, params, setSelection, seasonId, league, noData } = useLeagueData()
  const sort = parseStandingsSort(params.get('o'))
  const now = new Date()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t('navStandings')}</h1>
        <SeasonLeaguePicker />
      </div>
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) =>
          data.standings.length === 0 ? (
            <EmptyState>{t('emptySeason')}</EmptyState>
          ) : (
            <>
              <StandingsTable
                rows={data.standings}
                matches={data.matches}
                teamName={teamName}
                keep={keep}
                sort={sort}
                onSort={(s) => setSelection({ extra: { o: s.key === 'position' ? null : `${s.key}:${s.dir}` } })}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('latestResults')}</CardTitle>
                    <CardAction>
                      <Link to={`/menetrend${keep}${keep ? '&' : '?'}st=past`} className="text-sm underline-offset-2 hover:underline">{t('seeAll')}</Link>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <MatchList matches={filterMatches(data.matches, { status: 'played' }).slice(-6)} teamName={teamName} keep={keep} newestFirst />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('nextFixtures')}</CardTitle>
                    <CardAction>
                      <Link to={`/menetrend${keep}`} className="text-sm underline-offset-2 hover:underline">{t('seeAll')}</Link>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    {filterMatches(data.matches, { status: 'upcoming' }, now).length === 0 ? (
                      <EmptyState>{t('emptyFilter')}</EmptyState>
                    ) : (
                      <MatchList matches={filterMatches(data.matches, { status: 'upcoming' }, now).slice(0, 6)} teamName={teamName} keep={keep} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )
        }
      </QueryBoundary>
    </div>
  )
}
