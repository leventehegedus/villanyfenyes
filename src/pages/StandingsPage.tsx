import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bell } from 'lucide-react'
import { MatchList } from '@/components/MatchList'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'
import { StandingsTable } from '@/components/StandingsTable'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFavourites, usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { formatKickoff } from '@/lib/format'
import { LastSeenSnapshot, diffSinceSnapshot, mergeSnapshot } from '@/lib/last-seen'
import { filterMatches, nextMatch } from '@/lib/schedule'
import type { LeagueData } from '@/lib/data'
import type { Match } from '@/lib/schema'
import { readStored, writeStored } from '@/lib/storage'
import { parseStandingsSort } from '@/lib/url-state'

function NewSinceLastVisit({ matches }: { matches: readonly Match[] }) {
  const t = useT()
  const { prefs } = usePrefs()
  const { favourites } = useFavourites()
  // Read the previous snapshot once per page view, then store the current one.
  const [previous] = useState(() => readStored('last-seen', LastSeenSnapshot, null))
  useEffect(() => {
    if (favourites.length === 0 || matches.length === 0) return
    const stored = readStored('last-seen', LastSeenSnapshot, null)
    writeStored('last-seen', mergeSnapshot(stored, favourites, matches, new Date()))
  }, [favourites, matches])
  if (favourites.length === 0) return null
  const diff = diffSinceSnapshot(previous, favourites, matches)
  return (
    <p className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2 text-sm" role="status">
      <Bell className="size-4 shrink-0" aria-hidden />
      {diff.hasSnapshot
        ? t('newSince', { count: diff.newMatches.length, date: formatKickoff(diff.since, prefs.locale, prefs.timeZone) ?? '' })
        : t('noSnapshot')}
    </p>
  )
}

function PinnedFavourites({ data, teamName, keep }: { data: LeagueData; teamName: (id: string) => string; keep: string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const { favourites } = useFavourites()
  const rows = data.standings.filter((r) => favourites.includes(r.teamId))
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t('favourites')}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noFavourites')}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {rows.map((r) => {
              const next = nextMatch(r.teamId, data.matches)
              const opponent = next && (next.homeTeamId === r.teamId ? next.awayTeamId : next.homeTeamId)
              return (
                <li key={r.teamId} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link to={`/t/${encodeURIComponent(r.teamId)}${keep}`} className="font-semibold hover:underline">
                    {r.position}. {teamName(r.teamId)} · {r.points} {t('points')}
                  </Link>
                  <span className="text-muted-foreground">
                    {next && opponent
                      ? `${t('nextMatch')}: ${teamName(opponent)}, ${formatKickoff(next.kickoff, prefs.locale, prefs.timeZone) ?? t('noKickoff')}`
                      : t('noData')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

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
              <PinnedFavourites data={data} teamName={teamName} keep={keep} />
              <NewSinceLastVisit matches={data.matches} />
              <StandingsTable
                rows={data.standings}
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
                      <Link to={`/eredmenyek${keep}`} className="text-sm underline-offset-2 hover:underline">{t('seeAll')}</Link>
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
