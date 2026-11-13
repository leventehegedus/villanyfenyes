import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { Button } from '@/components/ui/button'
import { ChartContainer } from '@/components/ui/chart'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatDay } from '@/lib/format'
import type { Match, Team } from '@/lib/schema'
import { leagueProgression } from '@/lib/stats'
import { cn } from '@/lib/utils'

// Owner's choice: the top three wear medal colours and any number of teams can be highlighted.
// Beyond ~7 hues colour alone stops separating lines, so every highlighted line carries a direct
// end label (medals with their position) and non-podium lines are dashed; the tooltip lists all.
const MEDALS = ['var(--medal-1)', 'var(--medal-2)', 'var(--medal-3)']
const EXTRAS = Array.from({ length: 9 }, (_, i) => `var(--series-${i + 1})`)
const LABEL_STEP = 13 // px between labels of teams level on points

type Props = {
  teams: readonly Team[]
  matches: readonly Match[]
  /** Top three of the site table, in order. */
  podium: readonly string[]
  highlighted: readonly string[]
  onToggle: (teamId: string) => void
  onClear: () => void
}

type Look = { color: string; dashed: boolean; rank: number | null }

export default function LeagueProgressionChart({ teams, matches, podium, highlighted, onToggle, onClear }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const progression = leagueProgression(teams, matches)
  const rows = progression.map((r) => ({ label: formatDay(`${r.week}T12:00:00Z`, prefs.locale, 'UTC'), ...r.points }))
  const final = progression.at(-1)?.points ?? {}
  // One tick per win (3 points).
  const top = Math.max(3, Math.ceil(Math.max(0, ...Object.values(final)) / 3) * 3)
  const ticks = Array.from({ length: top / 3 + 1 }, (_, i) => i * 3)
  const name = new Map(teams.map((x) => [x.id, x.name]))

  const extras = highlighted.filter((id) => !podium.includes(id))
  const look = (id: string): Look | null => {
    if (!highlighted.includes(id)) return null
    const medal = podium.indexOf(id)
    if (medal >= 0) return { color: MEDALS[medal] ?? MEDALS[0] ?? '', dashed: false, rank: medal + 1 }
    return { color: EXTRAS[extras.indexOf(id)] ?? EXTRAS[0] ?? '', dashed: true, rank: null }
  }
  // Teams level on points get their end labels stacked tightly below each other.
  const labelOffset = new Map<string, number>()
  const seen = new Map<number, number>()
  for (const id of [...highlighted].sort((a, b) => (final[b] ?? 0) - (final[a] ?? 0) || podium.indexOf(b) - podium.indexOf(a))) {
    const pts = final[id] ?? 0
    const k = seen.get(pts) ?? 0
    labelOffset.set(id, k * LABEL_STEP)
    seen.set(pts, k + 1)
  }
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
            const l = look(id)
            return (
              <li key={id} className={cn('flex justify-between gap-4', l ? 'font-semibold' : 'text-muted-foreground')}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full" style={{ background: l?.color ?? 'var(--muted-foreground)' }} />
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
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('progressionHint')}>
        {teams.map((team) => {
          const l = look(team.id)
          return (
            <button
              key={team.id}
              type="button"
              aria-pressed={l !== null}
              onClick={() => onToggle(team.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent',
                l ? 'border-foreground/40 font-semibold' : 'text-muted-foreground',
              )}
            >
              <span className="inline-block size-2.5 rounded-full" style={{ background: l?.color ?? 'var(--muted-foreground)', opacity: l ? 1 : 0.4 }} />
              {team.name}
            </button>
          )
        })}
        <Button variant="ghost" size="sm" onClick={onClear} disabled={highlighted.length === 0}>
          {t('clearHighlight')}
        </Button>
      </div>
      <ChartContainer config={{}} className="aspect-auto h-80 w-full sm:h-96">
        <LineChart data={rows} margin={{ left: -16, right: 110, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis domain={[0, top]} ticks={ticks} interval={0} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip content={TooltipBody} cursor={{ strokeOpacity: 0.4 }} />
          {order.map((team) => {
            const l = look(team.id)
            const text = `${l?.rank ? `${l.rank}. ` : ''}${team.name}`
            return (
              <Line
                key={team.id}
                dataKey={team.id}
                name={team.name}
                type="linear"
                stroke={l?.color ?? 'var(--muted-foreground)'}
                strokeOpacity={l ? 1 : 0.3}
                strokeWidth={l ? 2.5 : 1.5}
                strokeDasharray={l?.dashed ? '6 3' : undefined}
                dot={l ? { r: 3, strokeWidth: 0, fill: l.color } : false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                label={
                  l
                    ? ({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) =>
                        index === rows.length - 1 ? (
                          <text x={Number(x) + 6} y={Number(y) + 4 + (labelOffset.get(team.id) ?? 0)} fontSize={11} fontWeight={600} fill="var(--foreground)">
                            {text.length > 17 ? `${text.slice(0, 16)}…` : text}
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
