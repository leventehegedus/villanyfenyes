import { Link } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MatchRow } from '@/components/MatchList'
import { EmptyState, ListSkeleton } from '@/components/QueryBoundary'
import { STRIPED_LIST } from '@/components/row-style'
import { Button } from '@/components/ui/button'
import { usePrefs, useT } from '@/hooks/prefs'
import { leagueQuery } from '@/hooks/queries'
import { useSelection } from '@/hooks/useSelection'
import { formatLongDay } from '@/lib/format'
import { matchDays, pickDay, siteDay, stepDay } from '@/lib/schedule'
import { cn } from '@/lib/utils'

/** Every league's matches on one Budapest day (?d=YYYY-MM-DD), grouped by league; arrows jump between match days. */
export function DayMatches() {
  const t = useT()
  const { prefs } = usePrefs()
  const { seasonId, leagues, isCurrent, noData, params, setSelection } = useSelection()
  const queries = useQueries({ queries: leagues.map((l) => leagueQuery(seasonId, l, isCurrent)) })
  const loaded = leagues.flatMap((league, i) => {
    const data = queries[i]?.data
    return data ? [{ league, data }] : []
  })
  const failed = leagues.filter((_, i) => queries[i]?.isError)
  const now = new Date()
  const days = matchDays(loaded.flatMap((l) => l.data.matches))
  const day = pickDay(days, params.get('d'), siteDay(now.toISOString()))
  const go = (d: string | null) => d && setSelection({ extra: { d } })

  if (noData) return <EmptyState>{t('noData')}</EmptyState>
  const pending = leagues.length === 0 || queries.some((q) => q.isPending)
  const prev = day && stepDay(days, day, -1)
  const next = day && stepDay(days, day, 1)
  const groups = loaded
    .map(({ league, data }) => {
      const names = new Map(data.teams.map((x) => [x.id, x.name]))
      return {
        league,
        teamName: (id: string) => names.get(id) ?? id,
        matches: data.matches.filter((m) => m.kickoff && siteDay(m.kickoff) === day).sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? '')),
      }
    })
    .filter((g) => g.matches.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => go(prev)} disabled={!prev} aria-label={t('dayPrev')} title={t('dayPrev')}>
          <ChevronLeft aria-hidden />
        </Button>
        <h2 className="text-center font-heading text-lg font-semibold" aria-live="polite">
          {day ? formatLongDay(day, prefs.locale) : t('noData')}
        </h2>
        <Button variant="outline" size="icon" onClick={() => go(next)} disabled={!next} aria-label={t('dayNext')} title={t('dayNext')}>
          <ChevronRight aria-hidden />
        </Button>
      </div>
      {failed.length > 0 && <p className="text-sm text-muted-foreground">{t('dayFailed', { leagues: failed.join(', ') })}</p>}
      {groups.length > 0 ? (
        groups.map((g) => (
          <section key={g.league} aria-labelledby={`day-${g.league}`}>
            <h3 id={`day-${g.league}`} className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Link to={`/?s=${seasonId ?? ''}&l=${g.league}`} className="hover:underline">
                {g.league}
              </Link>
            </h3>
            <ul className={cn('divide-y divide-border/60', STRIPED_LIST)}>
              {g.matches.map((m) => (
                <MatchRow key={m.id} match={m} teamName={g.teamName} keep={`?s=${seasonId ?? ''}&l=${g.league}`} now={now} />
              ))}
            </ul>
          </section>
        ))
      ) : pending ? (
        <ListSkeleton />
      ) : (
        <EmptyState>{t('dayEmpty')}</EmptyState>
      )}
    </div>
  )
}
