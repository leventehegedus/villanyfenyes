import { useEffect } from 'react'
import { Link } from 'react-router'
import { useFavourites, usePrefs, useT } from '@/hooks/prefs'
import { formatDay, formatKickoffShort } from '@/lib/format'
import { groupByWeek, weekStart } from '@/lib/schedule'
import type { Match } from '@/lib/schema'
import { isPlayed } from '@/lib/standings'
import { cn } from '@/lib/utils'

type RowProps = { match: Match; teamName: (id: string) => string; keep: string; now: Date }

export function MatchRow({ match: m, teamName, keep, now }: RowProps) {
  const t = useT()
  const { prefs } = usePrefs()
  const { isFavourite } = useFavourites()
  const played = isPlayed(m)
  const fav = isFavourite(m.homeTeamId) || isFavourite(m.awayTeamId)
  const when = formatKickoffShort(m.kickoff, prefs.locale, prefs.timeZone) ?? t('noKickoff')
  const future = m.kickoff !== null && Date.parse(m.kickoff) > now.getTime()
  const side = (id: string, align: string) => (
    <span className={cn('line-clamp-2 min-w-0 hyphens-auto', align, isFavourite(id) && 'font-semibold')}>{teamName(id)}</span>
  )
  return (
    <li>
      <Link
        to={`/m/${encodeURIComponent(m.id)}${keep}`}
        className={cn(
          'grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent focus-visible:bg-accent',
          fav && 'bg-primary/5 ring-1 ring-primary/20',
        )}
      >
        {side(m.homeTeamId, 'text-right')}
        <span className="flex min-w-16 flex-col items-center">
          {played ? (
            <span className="tabular rounded-md bg-secondary px-2 font-mono font-semibold">
              {m.homeGoals}:{m.awayGoals}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{future ? t('scheduled') : t('noResult')}</span>
          )}
          <span className="text-[11px] whitespace-nowrap text-muted-foreground">{when}</span>
        </span>
        {side(m.awayTeamId, 'text-left')}
      </Link>
    </li>
  )
}

/** Matches grouped by Budapest week (the site publishes no round numbers). */
export function MatchList({
  matches,
  teamName,
  keep,
  newestFirst = false,
  scrollToCurrent = false,
}: Omit<RowProps, 'match' | 'now'> & { matches: readonly Match[]; newestFirst?: boolean; scrollToCurrent?: boolean }) {
  const t = useT()
  const { prefs } = usePrefs()
  const now = new Date()
  const groups = groupByWeek(matches)
  if (newestFirst) groups.reverse()
  const thisWeek = weekStart(now.toISOString())
  const currentKey = groups.find((g) => g.week !== null && g.week >= thisWeek)?.week
  // Jump to this week once when the list first mounts (DOM side effect, not data fetching).
  useEffect(() => {
    if (scrollToCurrent) document.getElementById('current-week')?.scrollIntoView({ block: 'start' })
  }, [scrollToCurrent])
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section
          key={g.week ?? 'none'}
          id={scrollToCurrent && g.week === currentKey ? 'current-week' : undefined}
          className="scroll-mt-32"
          aria-label={g.week ?? t('noKickoff')}
        >
          <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {g.week ? t('weekOf', { date: formatDay(`${g.week}T12:00:00Z`, prefs.locale, 'UTC') }) : t('noKickoff')}
          </h3>
          <ul className="divide-y divide-border/60">
            {(newestFirst ? [...g.matches].reverse() : g.matches).map((m) => (
              <MatchRow key={m.id} match={m} teamName={teamName} keep={keep} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
