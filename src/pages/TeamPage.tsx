import { Suspense, lazy } from 'react'
import { useParams } from 'react-router'
import { FavouriteButton } from '@/components/FavouriteButton'
import { FormStrip } from '@/components/FormStrip'
import { Markers } from '@/components/Markers'
import { MatchList } from '@/components/MatchList'
import { EmptyState, ListSkeleton, QueryBoundary } from '@/components/QueryBoundary'
import { SeasonLeaguePicker } from '@/components/SeasonLeaguePicker'
import { Stat } from '@/components/Stat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import type { LeagueData } from '@/lib/data'
import { formatDecimal } from '@/lib/format'
import { filterMatches } from '@/lib/schedule'
import { aggregateScorers } from '@/lib/scorers'
import { teamStats } from '@/lib/stats'
import type { TeamResult } from '@/lib/stats'

const TeamCharts = lazy(() => import('@/components/TeamCharts'))

function TeamView({ teamId, data, keep, teamName }: { teamId: string; data: LeagueData; keep: string; teamName: (id: string) => string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const team = data.teams.find((x) => x.id === teamId)
  if (!team) return <EmptyState>{t('teamNotFound')}</EmptyState>
  const row = data.standings.find((r) => r.teamId === teamId)
  const summary = data.summaries.find((s) => s.teamId === teamId)
  const s = teamStats(teamId, data.matches)
  const scorers = aggregateScorers(data.matches).rows.filter((r) => r.teamId === teamId).slice(0, 5)
  const missing = t('noData')
  const result = (r: TeamResult | null) => (r ? `${r.goalsFor}:${r.goalsAgainst} – ${teamName(r.opponentId)}` : null)
  const dec = (n: number | null) => formatDecimal(n, prefs.locale)

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <FavouriteButton teamId={team.id} name={team.name} />
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.league} · {t('position')}: {row?.position ?? missing} · {t('points')}: {row?.points ?? missing}
          </p>
          {row && <Markers markers={row.markers} />}
        </div>
        <div title={t('formHint')}>
          <p className="mb-1 text-xs text-muted-foreground">{t('form')}</p>
          <FormStrip form={s.form} locale={prefs.locale} />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t('statsTitle')}</CardTitle>
          <CardDescription>{t('computedNote')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t('played')} value={s.played} missing={missing} />
            <Stat label={t('goalsForPerMatch')} value={dec(s.goalsForPerMatch)} missing={missing} />
            <Stat label={t('goalsAgainstPerMatch')} value={dec(s.goalsAgainstPerMatch)} missing={missing} />
            <Stat label={t('goalDiff')} value={s.played ? s.goalDiff : null} missing={missing} />
            <Stat label={t('cleanSheets')} value={s.played ? s.cleanSheets : null} missing={missing} />
            <Stat label={t('streak')} value={s.streak ? `${s.streak.length}× ${t(s.streak.outcome === 'W' ? 'win' : s.streak.outcome === 'D' ? 'draw' : 'loss')}` : null} missing={missing} />
            <Stat label={t('biggestWin')} value={result(s.biggestWin)} missing={missing} />
            <Stat label={t('biggestDefeat')} value={result(s.biggestDefeat)} missing={missing} />
            <Stat label={t('highestScoring')} value={result(s.highestScoring)} missing={missing} />
          </dl>
          {s.played > 1 && (
            <Suspense fallback={<ListSkeleton rows={2} />}>
              <TeamCharts progression={s.pointsProgression} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('scorers')}</CardTitle>
            <CardDescription>{t('computedNote')}</CardDescription>
          </CardHeader>
          <CardContent>
            {scorers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('scorersEmpty')}</p>
            ) : (
              <ol className="space-y-1 text-sm">
                {scorers.map((p) => (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="tabular font-semibold">{p.goals}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('siteSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t('topScorer')}</dt>
              <dd>{summary?.topScorer ? `${summary.topScorer.name} (${summary.topScorer.goals})` : missing}</dd>
              <dt className="text-muted-foreground">{t('bestLeague')}</dt>
              <dd>{summary?.bestLeague ?? missing}</dd>
              <dt className="text-muted-foreground">{t('seasonsCount')}</dt>
              <dd>{summary?.seasonsCount ?? missing}</dd>
              <dt className="text-muted-foreground">{t('matchesPlayed')}</dt>
              <dd>{summary?.matchesPlayed ?? missing}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('fixtures')}</h2>
        <MatchList matches={filterMatches(data.matches, { teamId })} teamName={teamName} keep={keep} />
      </section>
    </div>
  )
}

export default function TeamPage() {
  const { teamId = '' } = useParams()
  const { query, keep, teamName, seasonId, league, noData } = useLeagueData()
  return (
    <div className="space-y-4">
      <SeasonLeaguePicker />
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => <TeamView teamId={teamId} data={data} keep={keep} teamName={teamName} />}
      </QueryBoundary>
    </div>
  )
}
