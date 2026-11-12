import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatKickoffShort } from '@/lib/format'
import { OUTCOME_STYLE } from '@/components/outcome-style'
import type { TeamResult } from '@/lib/stats'
import { cn } from '@/lib/utils'

type Props = { results: readonly TeamResult[]; teamName: (id: string) => string; keep: string }

/** Last results as letter chips (never colour alone); hover or focus shows the match, click opens it. */
export function FormStrip({ results, teamName, keep }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  if (results.length === 0) return <span className="text-xs text-muted-foreground">{t('noData')}</span>
  return (
    <ol className="flex gap-0.5" aria-label={t('formHint')}>
      {results.map((r) => {
        const style = OUTCOME_STYLE[r.outcome]
        const text = `${t(style.label)} ${r.goalsFor}:${r.goalsAgainst} – ${teamName(r.opponentId)}, ${formatKickoffShort(r.kickoff, prefs.locale, prefs.timeZone) ?? ''}`
        return (
          <li key={r.matchId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/m/${encodeURIComponent(r.matchId)}${keep}`}
                  aria-label={text}
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
