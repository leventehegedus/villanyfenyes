import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { useT } from '@/hooks/prefs'
import type { goalsPerSeason } from '@/lib/alltime'

/** Goals for and against per match, one point per season, oldest first. */
export default function GoalsChart({ data }: { data: ReturnType<typeof goalsPerSeason> }) {
  const t = useT()
  const config = {
    forPerMatch: { label: t('goalsForPerMatch'), color: 'var(--win)' },
    againstPerMatch: { label: t('goalsAgainstPerMatch'), color: 'var(--loss)' },
  } satisfies ChartConfig
  return (
    <figure>
      <figcaption className="mb-1 text-sm font-semibold">{t('goalsPerSeason')}</figcaption>
      <ChartContainer config={config} className="h-56 w-full">
        <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {(['forPerMatch', 'againstPerMatch'] as const).map((key) => (
            <Line key={key} dataKey={key} stroke={`var(--color-${key})`} strokeWidth={2} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>
    </figure>
  )
}
