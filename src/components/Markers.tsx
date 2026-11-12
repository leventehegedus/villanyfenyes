import { ArrowDown, ArrowUp, Flame, Shield, Snowflake, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/hooks/prefs'
import type { MessageKey } from '@/i18n/dict'
import type { Marker } from '@/lib/schema'
import { cn } from '@/lib/utils'

const MARKERS: Record<Marker, { icon: LucideIcon; label: MessageKey; className: string }> = {
  promotion: { icon: ArrowUp, label: 'markerPromotion', className: 'text-win' },
  relegation: { icon: ArrowDown, label: 'markerRelegation', className: 'text-loss' },
  winStreak: { icon: Flame, label: 'markerWinStreak', className: 'text-orange-500' },
  lossStreak: { icon: Snowflake, label: 'markerLossStreak', className: 'text-sky-500' },
  manyGoals: { icon: Target, label: 'markerManyGoals', className: 'text-muted-foreground' },
  fewConceded: { icon: Shield, label: 'markerFewConceded', className: 'text-muted-foreground' },
}

const TEXT_MARKERS: Marker[] = ['promotion', 'relegation']

/** Promotion/relegation as icon + text; streak and scoring markers as labelled icons. */
export function Markers({ markers }: { markers: readonly Marker[] }) {
  const t = useT()
  if (markers.length === 0) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {markers.map((m) => {
        const { icon: Icon, label, className } = MARKERS[m]
        if (TEXT_MARKERS.includes(m)) {
          return (
            <span key={m} className={cn('inline-flex items-center gap-0.5 rounded border px-1 text-[11px] font-medium', className)}>
              <Icon className="size-3" aria-hidden />
              {t(label)}
            </span>
          )
        }
        return (
          <Tooltip key={m}>
            <TooltipTrigger asChild>
              <span tabIndex={0} className={cn('inline-flex rounded', className)}>
                <Icon className="size-3.5" aria-hidden />
                <span className="sr-only">{t(label)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t(label)}</TooltipContent>
          </Tooltip>
        )
      })}
    </span>
  )
}
