import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { usePrefs, useT } from '@/hooks/prefs'
import type { TeamStats } from '@/lib/stats'

/** Points progression and goals per match; only rendered when there are results. */
export default function TeamCharts({ progression }: { progression: TeamStats['pointsProgression'] }) {
  const t = useT()
  const { prefs } = usePrefs()
  const day = new Intl.DateTimeFormat(prefs.locale, { month: 'numeric', day: 'numeric', timeZone: prefs.timeZone })
  const data = progression.map((p, i) => ({ ...p, label: p.kickoff ? day.format(new Date(p.kickoff)) : String(i + 1) }))
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
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="points" stroke="var(--color-points)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      </figure>
      <figure>
        <figcaption className="mb-1 text-sm font-semibold">{t('goalsPerMatch')}</figcaption>
        <ChartContainer config={goalsConfig} className="h-48 w-full">
          <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="goalsFor" fill="var(--color-goalsFor)" radius={2} isAnimationActive={false} />
            <Bar dataKey="goalsAgainst" fill="var(--color-goalsAgainst)" radius={2} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </figure>
    </div>
  )
}
