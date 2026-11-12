import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer } from '@/components/ui/chart'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatDay } from '@/lib/format'
import type { Team } from '@/lib/schema'
import { leagueProgression } from '@/lib/stats'
import type { Match } from '@/lib/schema'
import { cn } from '@/lib/utils'

const SLOTS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']

type Props = {
  teams: readonly Team[]
  matches: readonly Match[]
  /** Highlighted team ids in selection order; colour follows the slot, never the rank. */
  highlighted: readonly string[]
  onToggle: (teamId: string) => void
}

/**
 * Points of every team week by week. More than four coloured lines are unreadable, so all teams
 * draw as muted lines and up to four highlighted teams get a validated categorical colour,
 * a legend chip and a direct label at the line end.
 */
export default function LeagueProgressionChart({ teams, matches, highlighted, onToggle }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const rows = leagueProgression(teams, matches).map((r) => ({
    label: formatDay(`${r.week}T12:00:00Z`, prefs.locale, 'UTC'),
    ...r.points,
  }))
  const name = new Map(teams.map((x) => [x.id, x.name]))
  const color = (id: string) => SLOTS[highlighted.indexOf(id)]
  // Draw muted lines first so highlighted ones sit on top.
  const order = [...teams].sort((a, b) => Number(highlighted.includes(a.id)) - Number(highlighted.includes(b.id)))

  const TooltipBody = ({ active, payload, label }: TooltipContentProps<ValueType, NameType>) => {
    if (!active || !payload?.length) return null
    const sorted = [...payload].sort((a, b) => Number(b.value) - Number(a.value))
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
        <p className="mb-1 font-semibold">{t('weekOf', { date: String(label) })}</p>
        <ol className="space-y-0.5">
          {sorted.map((p) => {
            const id = String(p.dataKey)
            return (
              <li key={id} className={cn('flex justify-between gap-4', highlighted.includes(id) ? 'font-semibold' : 'text-muted-foreground')}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full" style={{ background: color(id) ?? 'var(--muted-foreground)' }} />
                  {name.get(id)}
                </span>
                <span className="tabular">{p.value}</span>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('progressionHint')}>
        {teams.map((team) => {
          const on = highlighted.includes(team.id)
          return (
            <button
              key={team.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(team.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent',
                on ? 'border-foreground/40 font-semibold' : 'text-muted-foreground',
              )}
            >
              <span className="inline-block size-2.5 rounded-full" style={{ background: color(team.id) ?? 'var(--muted-foreground)', opacity: on ? 1 : 0.4 }} />
              {team.name}
            </button>
          )
        })}
      </div>
      <ChartContainer config={{}} className="aspect-auto h-80 w-full sm:h-96">
        <LineChart data={rows} margin={{ left: -16, right: 96, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip content={TooltipBody} cursor={{ strokeOpacity: 0.4 }} />
          {order.map((team) => {
            const c = color(team.id)
            return (
              <Line
                key={team.id}
                dataKey={team.id}
                name={team.name}
                type="linear"
                stroke={c ?? 'var(--muted-foreground)'}
                strokeOpacity={c ? 1 : 0.3}
                strokeWidth={c ? 2.5 : 1.5}
                dot={c ? { r: 3, strokeWidth: 0, fill: c } : false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                label={
                  c
                    ? ({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) =>
                        index === rows.length - 1 ? (
                          <text x={Number(x) + 6} y={Number(y) + 4} fontSize={11} fontWeight={600} fill="var(--foreground)">
                            {team.name.length > 14 ? `${team.name.slice(0, 13)}…` : team.name}
                          </text>
                        ) : (
                          <g />
                        )
                    : false
                }
              />
            )
          })}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
