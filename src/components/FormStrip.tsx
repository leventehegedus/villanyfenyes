import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatKickoffShort, matchLabel } from '@/lib/format'
import { OUTCOME_STYLE } from '@/components/outcome-style'
import type { TeamResult } from '@/lib/stats'
import { cn } from '@/lib/utils'

type Props = { teamId: string; results: readonly TeamResult[]; teamName: (id: string) => string; keep: string }

/** Last results as letter chips, newest on the left (never colour alone); hover shows the match (home first), click opens it. */
export function FormStrip({ teamId, results, teamName, keep }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  if (results.length === 0) return <span className="text-xs text-muted-foreground">{t('noData')}</span>
  return (
    <ol className="flex gap-0.5" aria-label={t('formHint')}>
      {[...results].reverse().map((r) => {
        const style = OUTCOME_STYLE[r.outcome]
        const text = matchLabel(r, teamId, teamName)
        return (
          <li key={r.matchId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/m/${encodeURIComponent(r.matchId)}${keep}`}
                  aria-label={`${t(style.label)}: ${text}, ${formatKickoffShort(r.kickoff, prefs.locale, prefs.timeZone) ?? ''}`}
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
