import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatKickoffShort, matchLabel } from '@/lib/format'
import { OUTCOME_STYLE } from '@/components/outcome-style'
import type { Match } from '@/lib/schema'
import type { TeamResult } from '@/lib/stats'
import { cn } from '@/lib/utils'

type Props = { teamId: string; results: readonly TeamResult[]; next: Match | null; teamName: (id: string) => string; keep: string }

/** Next fixture as a "?" chip, then last results as letter chips, newest on the left (never colour alone); hover shows the match (home first), click opens it. */
export function FormStrip({ teamId, results, next, teamName, keep }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  if (results.length === 0 && !next) return <span className="text-xs text-muted-foreground">{t('noData')}</span>
  return (
    <ol className="flex gap-0.5" aria-label={t('formHint')}>
      {next && <NextChip match={next} teamName={teamName} keep={keep} />}
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

function NextChip({ match, teamName, keep }: { match: Match; teamName: (id: string) => string; keep: string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const when = formatKickoffShort(match.kickoff, prefs.locale, prefs.timeZone) ?? t('noData')
  const text = `${t('nextMatch')}: ${teamName(match.homeTeamId)} – ${teamName(match.awayTeamId)}, ${when}`
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={`/m/${encodeURIComponent(match.id)}${keep}`}
            aria-label={text}
            className="grid size-5 place-items-center rounded-sm border border-dashed border-muted-foreground/50 text-[10px] font-bold text-muted-foreground"
          >
            ?
          </Link>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </li>
  )
}
