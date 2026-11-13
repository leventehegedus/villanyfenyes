import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { SOURCE_SITE } from '@/lib/config'
import { formatKickoff } from '@/lib/format'
import type { LeagueData } from '@/lib/data'
import type { Match } from '@/lib/schema'
import { isPlayed } from '@/lib/standings'

function MatchDetails({ match: m, data, keep }: { match: Match; data: LeagueData; keep: string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const team = (id: string) => data.teams.find((x) => x.id === id)
  const home = team(m.homeTeamId)
  const source = m.siteId !== null && home?.siteId != null ? `${SOURCE_SITE}/tabella/${m.siteId}/eredmenyek/${home.siteId}` : data.sourceUrl
  const teamLink = (id: string) => (
    <Link to={`/t/${encodeURIComponent(id)}${keep}`} className="font-semibold hover:underline">
      {team(id)?.name ?? id}
    </Link>
  )
  return (
    <div className="space-y-5 pt-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        {teamLink(m.homeTeamId)}
        <span className="tabular rounded-lg bg-secondary px-3 py-1 font-mono text-2xl font-bold">
          {isPlayed(m) ? `${m.homeGoals}:${m.awayGoals}` : '–:–'}
        </span>
        {teamLink(m.awayTeamId)}
      </div>
      <p className="text-center text-sm text-muted-foreground">{formatKickoff(m.kickoff, prefs.locale, prefs.timeZone) ?? t('noKickoff')}</p>
      {isPlayed(m) && (
        <section>
          <h3 className="mb-2 text-center text-sm font-semibold">{t('scorers')}</h3>
          {m.scorers === null ? (
            <p className="text-center text-sm text-muted-foreground">{t('scorersUnknown')}</p>
          ) : m.scorers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">{t('scorersNone')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-6 text-sm">
              {[m.homeTeamId, m.awayTeamId].map((id, side) => (
                <ul key={id} className={side === 0 ? 'space-y-0.5 text-right' : 'space-y-0.5'}>
                  {m.scorers?.filter((sc) => sc.teamId === id).map((sc) => (
                    <li key={sc.name}>
                      {sc.name}
                      {sc.goals > 1 && <span className="tabular ml-1 font-semibold">×{sc.goals}</span>}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </section>
      )}
      <a href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline underline-offset-2">
        {t('officialPage')} <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </div>
  )
}

export default function MatchDialog() {
  const t = useT()
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { query, keep, seasonId, league, noData } = useLeagueData()
  // Back to wherever the match was opened from; a direct deep link falls back to the results list.
  const close = () => (location.key === 'default' ? navigate(`/menetrend${keep}`) : navigate(-1))
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent closeLabel={t('close')} className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{t('matchDetails')}</DialogTitle>
          <DialogDescription className="sr-only">{t('matchDetails')}</DialogDescription>
        </DialogHeader>
        <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
          {(data) => {
            const m = data.matches.find((x) => x.id === matchId)
            return m ? <MatchDetails match={m} data={data} keep={keep} /> : <EmptyState>{t('matchNotFound')}</EmptyState>
          }}
        </QueryBoundary>
      </DialogContent>
    </Dialog>
  )
}
