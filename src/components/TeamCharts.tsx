import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { usePrefs, useT } from '@/hooks/prefs'
import { matchLabel, stepTicks } from '@/lib/format'
import { weekStart } from '@/lib/schedule'
import { CLICKABLE_CHART, clickedIndex } from '@/lib/charts'
import type { ChartClick } from '@/lib/charts'
import type { TeamStats } from '@/lib/stats'

type Props = {
  teamId: string
  progression: TeamStats['pointsProgression']
  teamName: (id: string) => string
  /** Week (Monday, YYYY-MM-DD) whose table is shown below; marked on both charts. */
  selectedWeek: string | null
  onSelectWeek: (week: string) => void
}

/** Points progression and goals per match; hover shows the match (home first) and its date. */
export default function TeamCharts({ teamId, progression, teamName, selectedWeek, onSelectWeek }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const day = new Intl.DateTimeFormat(prefs.locale, { month: 'numeric', day: 'numeric', timeZone: prefs.timeZone })
  const data = progression.map((p, i) => ({
    ...p,
    label: p.kickoff ? day.format(new Date(p.kickoff)) : String(i + 1),
    match: matchLabel(p, teamId, teamName),
    week: p.kickoff ? weekStart(p.kickoff) : null,
  }))
  const selectedLabel = data.find((d) => d.week !== null && d.week === selectedWeek)?.label
  // Clicking anywhere on a chart picks the week of the nearest match.
  const select = (state: ChartClick) => {
    const week = data[clickedIndex(state, data.map((d) => d.label)) ?? -1]?.week
    if (week) onSelectWeek(week)
  }
  const marker = selectedLabel ? <ReferenceLine x={selectedLabel} stroke="var(--primary)" strokeDasharray="4 3" /> : null
  // One tick per win, like the league chart.
  const pointTicks = stepTicks(progression.at(-1)?.points ?? 0, 3)
  // Same as every other match hover: just "Home h:a Away".
  const matchOnly = ({ active, payload }: { active?: boolean; payload?: readonly { payload?: { match?: string } }[] }) =>
    active && payload?.[0]?.payload?.match ? (
      <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs font-medium shadow-md">{payload[0].payload.match}</div>
    ) : null
  const tooltip = (
    <ChartTooltipContent
      labelFormatter={(label, payload) => {
        const row = payload[0]?.payload as { match?: string } | undefined
        return `${row?.match ?? ''} · ${String(label)}`
      }}
    />
  )
  const pointsConfig = { points: { label: t('points'), color: 'var(--chart-1)' } } satisfies ChartConfig
  const goalsConfig = {
    goalsFor: { label: t('goalsFor'), color: 'var(--win)' },
    goalsAgainst: { label: t('goalsAgainst'), color: 'var(--loss)' },
  } satisfies ChartConfig

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <figure>
        <figcaption className="mb-1 text-sm font-semibold">{t('pointsProgression')}</figcaption>
        <ChartContainer config={pointsConfig} className="h-48 w-full">
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }} onClick={select} className={CLICKABLE_CHART}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis domain={[0, pointTicks.at(-1) ?? 3]} ticks={pointTicks} interval={0} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={tooltip} />
            {marker}
            <Line dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm font-semibold">{t('goalsPerMatch')}</figcaption>
        <ChartContainer config={goalsConfig} className="h-48 w-full">
          <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }} onClick={select} className={CLICKABLE_CHART}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={matchOnly} />
            {marker}
            <Bar dataKey="goalsFor" fill="var(--color-goalsFor)" radius={2} isAnimationActive={false} />
            <Bar dataKey="goalsAgainst" fill="var(--color-goalsAgainst)" radius={2} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </figure>
    </div>
  )
}
