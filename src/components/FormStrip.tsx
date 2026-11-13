import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatKickoffShort } from '@/lib/format'
import { OUTCOME_STYLE } from '@/components/outcome-style'
import type { TeamResult } from '@/lib/stats'
import { cn } from '@/lib/utils'

type Props = { teamId: string; results: readonly TeamResult[]; teamName: (id: string) => string; keep: string }

/** Last results as letter chips (never colour alone); hover or focus shows the match, click opens it. */
export function FormStrip({ teamId, results, teamName, keep }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  if (results.length === 0) return <span className="text-xs text-muted-foreground">{t('noData')}</span>
  return (
    <ol className="flex gap-0.5" aria-label={t('formHint')}>
      {results.map((r) => {
        const style = OUTCOME_STYLE[r.outcome]
        // The match as listed on the site (home first), so the score never reads backwards.
        const [home, away, hg, ag] = r.home
          ? [teamName(teamId), teamName(r.opponentId), r.goalsFor, r.goalsAgainst]
          : [teamName(r.opponentId), teamName(teamId), r.goalsAgainst, r.goalsFor]
        const when = formatKickoffShort(r.kickoff, prefs.locale, prefs.timeZone)
        const text = `${home} ${hg}:${ag} ${away}${when ? `, ${when}` : ''}`
        return (
          <li key={r.matchId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/m/${encodeURIComponent(r.matchId)}${keep}`}
                  aria-label={`${t(style.label)}: ${text}`}
                  className={cn('grid size-5 place-items-center rounded-sm text-[10px] font-bold', style.className)}
                >
                  {style[prefs.locale]}
                </Link>
              </TooltipTrigger>
              <TooltipContent>{text}</TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ol>
  )
}
