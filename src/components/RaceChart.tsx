import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { ChartContainer } from '@/components/ui/chart'
import { CLICKABLE_CHART, clickedIndex } from '@/lib/charts'
import { stepTicks } from '@/lib/format'
import { cn } from '@/lib/utils'

export type RaceSeries = {
  key: string
  /** Name in the tooltip. */
  label: string
  /** Direct label at the line end (highlighted series only). */
  endLabel: string
  /** null = muted background line without an end label. */
  color: string | null
  dashed?: boolean
}

export type RaceRow = { label: string; values: Record<string, number> }

type Props = {
  rows: readonly RaceRow[]
  series: readonly RaceSeries[]
  tickStep: number
  title: (label: string) => string
  /** Row index marked with a vertical line. */
  selected?: number | null
  /** Called with the clicked row index; makes the chart clickable. */
  onSelect?: (index: number) => void
}

const LABEL_STEP = 13 // px between end labels of series that finish level

/** Cumulative lines over weeks: muted context lines, coloured highlights with stacked end labels. */
export function RaceChart({ rows, series, tickStep, title, selected = null, onSelect }: Props) {
  const final = rows.at(-1)?.values ?? {}
  const ticks = stepTicks(Math.max(0, ...Object.values(final)), tickStep)
  const byKey = new Map(series.map((s) => [s.key, s]))
  const offset = new Map<string, number>()
  const level = new Map<number, number>()
  for (const s of series.filter((x) => x.color).sort((a, b) => (final[b.key] ?? 0) - (final[a.key] ?? 0))) {
    const v = final[s.key] ?? 0
    offset.set(s.key, (level.get(v) ?? 0) * LABEL_STEP)
    level.set(v, (level.get(v) ?? 0) + 1)
  }
  // Muted lines first so highlighted ones are drawn on top.
  const order = [...series].sort((a, b) => Number(Boolean(a.color)) - Number(Boolean(b.color)))

  const TooltipBody = ({ active, payload, label }: TooltipContentProps<ValueType, NameType>) => {
    if (!active || !payload?.length) return null
    const sorted = [...payload].sort((a, b) => Number(b.value) - Number(a.value))
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
        <p className="mb-1 font-semibold">{title(String(label))}</p>
        <ol className="space-y-0.5">
          {sorted.map((p) => {
            const s = byKey.get(String(p.name))
            return (
              <li key={String(p.name)} className={cn('flex justify-between gap-4', s?.color ? 'font-semibold' : 'text-muted-foreground')}>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2 rounded-full" style={{ background: s?.color ?? 'var(--muted-foreground)' }} />
                  {s?.label}
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
    <ChartContainer config={{}} className="aspect-auto h-80 w-full sm:h-96">
      <LineChart
        data={[...rows]}
        margin={{ left: -16, right: 110, top: 8, bottom: 0 }}
        className={onSelect ? CLICKABLE_CHART : undefined}
        onClick={(state) => {
          const i = clickedIndex(state, rows.map((r) => r.label))
          if (onSelect && i !== null) onSelect(i)
        }}
      >
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis domain={[0, ticks.at(-1) ?? tickStep]} ticks={ticks} interval={0} tickLine={false} axisLine={false} fontSize={11} />
        <Tooltip content={TooltipBody} cursor={{ strokeOpacity: 0.4 }} />
        {selected !== null && rows[selected] && <ReferenceLine x={rows[selected].label} stroke="var(--primary)" strokeDasharray="4 3" />}
        {order.map((s) => (
          <Line
            key={s.key}
            name={s.key}
            // Function key: string keys are read as property paths, so ids with dots would break.
            dataKey={(row: RaceRow) => row.values[s.key] ?? 0}
            type="linear"
            stroke={s.color ?? 'var(--muted-foreground)'}
            strokeOpacity={s.color ? 1 : 0.3}
            strokeWidth={s.color ? 2.5 : 1.5}
            strokeDasharray={s.dashed ? '6 3' : undefined}
            dot={s.color ? { r: 3, strokeWidth: 0, fill: s.color } : false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            label={
              s.color
                ? ({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) =>
                    index === rows.length - 1 ? (
                      <text x={Number(x) + 6} y={Number(y) + 4 + (offset.get(s.key) ?? 0)} fontSize={11} fontWeight={600} fill="var(--foreground)">
                        {s.endLabel.length > 17 ? `${s.endLabel.slice(0, 16)}…` : s.endLabel}
                      </text>
                    ) : (
                      <g />
                    )
                : false
            }
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
