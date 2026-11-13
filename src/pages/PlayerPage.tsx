import { Link, useParams } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { Stat } from '@/components/Stat'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { formatKickoffShort, matchLabel } from '@/lib/format'
import { playerLog } from '@/lib/players'
import { aggregateScorers } from '@/lib/scorers'

export default function PlayerPage() {
  const t = useT()
  const { prefs } = usePrefs()
  const { teamId = '', name = '' } = useParams()
  const { query, keep, teamName, seasonId, league, noData } = useLeagueData()

  return (
    <div className="space-y-4">
      <PageHeader title={name}>
        <Link to={`/t/${encodeURIComponent(teamId)}${keep}`} className="text-sm text-muted-foreground hover:underline">
          {teamName(teamId)}
        </Link>
      </PageHeader>
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          const log = playerLog(teamId, name, data.matches)
          if (log.goals === 0) return <EmptyState>{t('playerNotFound')}</EmptyState>
          const rank = aggregateScorers(data.matches).rows.find((r) => r.teamId === teamId && r.name === name)?.rank ?? null
          const missing = t('noData')
          return (
            <>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label={t('goals')} value={log.goals} missing={missing} />
                <Stat label={t('scorerRank')} value={rank ? `${rank}.` : null} missing={missing} />
                <Stat label={t('matchesScoredIn')} value={log.matchesScored} missing={missing} />
                <Stat label={t('currentStreak')} value={t('streakMatches', { n: log.currentStreak })} missing={missing} />
                <Stat label={t('longestStreak')} value={t('streakMatches', { n: log.longestStreak })} missing={missing} />
              </dl>
              <p className="text-sm text-muted-foreground">{t('computedNote')}</p>
              <section>
                <h2 className="mb-2 text-lg font-semibold">{t('playerMatches')}</h2>
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead>{t('match')}</TableHead>
                        <TableHead className="text-right">{t('goals')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...log.entries].reverse().map((e) => (
                        <TableRow key={e.matchId}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatKickoffShort(e.kickoff, prefs.locale, prefs.timeZone) ?? missing}
                          </TableCell>
                          <TableCell>
                            <Link to={`/m/${encodeURIComponent(e.matchId)}${keep}`} className="hover:underline">
                              {matchLabel(e, teamId, teamName)}
                            </Link>
                          </TableCell>
                          <TableCell className="tabular text-right font-semibold">
                            {e.goals === null ? <span className="font-normal text-muted-foreground">{missing}</span> : e.goals || '–'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </table>
                </div>
              </section>
            </>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
