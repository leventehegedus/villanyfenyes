import { Link, useNavigate, useParams } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { SOURCE_SITE } from '@/lib/config'
import { formatKickoff } from '@/lib/format'
import type { LeagueData } from '@/lib/data'
import type { Match } from '@/lib/schema'
import { isPlayed } from '@/lib/standings'

function Scorers({ match, teamId }: { match: Match; teamId: string }) {
  const t = useT()
  if (match.scorers === null) return <p className="text-sm text-muted-foreground">{t('scorersUnknown')}</p>
  const list = match.scorers.filter((s) => s.teamId === teamId)
  if (list.length === 0) return <p className="text-sm text-muted-foreground">{t('scorersNone')}</p>
  return (
    <ul className="space-y-0.5 text-sm">
      {list.map((s) => (
        <li key={s.name} className="flex justify-between gap-2">
          <span>{s.name}</span>
          <span className="tabular font-semibold">{s.goals}</span>
        </li>
      ))}
    </ul>
  )
}

function MatchDetails({ match: m, data, keep }: { match: Match; data: LeagueData; keep: string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const team = (id: string) => data.teams.find((x) => x.id === id)
  const home = team(m.homeTeamId)
  const away = team(m.awayTeamId)
  const source = m.siteId !== null && home?.siteId != null ? `${SOURCE_SITE}/tabella/${m.siteId}/eredmenyek/${home.siteId}` : data.sourceUrl
  const teamLink = (id: string) => (
    <Link to={`/t/${encodeURIComponent(id)}${keep}`} className="font-semibold hover:underline">
      {team(id)?.name ?? id}
    </Link>
  )
  return (
    <div className="space-y-5 px-4 pb-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        {teamLink(m.homeTeamId)}
        <span className="tabular rounded-lg bg-secondary px-3 py-1 font-mono text-2xl font-bold">
          {isPlayed(m) ? `${m.homeGoals}:${m.awayGoals}` : '–:–'}
        </span>
        {teamLink(m.awayTeamId)}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t('kickoff')}</dt>
        <dd>{formatKickoff(m.kickoff, prefs.locale, prefs.timeZone) ?? t('noData')}</dd>
        <dt className="text-muted-foreground">{t('venue')}</dt>
        <dd>{m.venue ?? t('noData')}</dd>
        <dt className="text-muted-foreground">{t('league')}</dt>
        <dd>{data.league}</dd>
        <dt className="text-muted-foreground">{t('round')}</dt>
        <dd className="text-muted-foreground">{t('roundNotPublished')}</dd>
      </dl>
      {isPlayed(m) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {[m.homeTeamId, m.awayTeamId].map((id) => (
            <div key={id}>
              <h3 className="mb-1 text-sm font-semibold">
                {t('scorers')} · {home?.id === id ? home.name : away?.name}
              </h3>
              <Scorers match={m} teamId={id} />
            </div>
          ))}
        </section>
      )}
      <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-2">
        {t('officialPage')} <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  )
}

export default function MatchSheet() {
  const t = useT()
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const { query, keep, seasonId, league } = useLeagueData()
  return (
    <Sheet open onOpenChange={(open) => !open && navigate(`/eredmenyek${keep}`)}>
      <SheetContent closeLabel={t('close')} side="bottom" className="max-h-[90svh] overflow-y-auto sm:mx-auto sm:max-w-xl sm:rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{t('matchDetails')}</SheetTitle>
          <SheetDescription className="sr-only">{t('matchDetails')}</SheetDescription>
        </SheetHeader>
        <QueryBoundary query={query} idle={seasonId === null || league === null}>
          {(data) => {
            const m = data.matches.find((x) => x.id === matchId)
            return m ? <MatchDetails match={m} data={data} keep={keep} /> : <EmptyState>{t('matchNotFound')}</EmptyState>
          }}
        </QueryBoundary>
      </SheetContent>
    </Sheet>
  )
}
