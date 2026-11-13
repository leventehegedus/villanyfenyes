import { RaceChart } from '@/components/RaceChart'
import type { RaceSeries } from '@/components/RaceChart'
import { Button } from '@/components/ui/button'
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

type Props = {
  teams: readonly Team[]
  matches: readonly Match[]
  /** Top three of the site table, in order. */
  podium: readonly string[]
  highlighted: readonly string[]
  onToggle: (teamId: string) => void
  onClear: () => void
  /** Week (Monday, YYYY-MM-DD) whose table is shown below; marked on the chart. */
  selectedWeek: string | null
  onSelectWeek: (week: string) => void
}

export default function LeagueProgressionChart({ teams, matches, podium, highlighted, onToggle, onClear, selectedWeek, onSelectWeek }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const progression = leagueProgression(teams, matches)
  const rows = progression.map((r) => ({ label: formatDay(`${r.week}T12:00:00Z`, prefs.locale, 'UTC'), values: r.points }))
  const selected = progression.findIndex((r) => r.week === selectedWeek)
  const extras = highlighted.filter((id) => !podium.includes(id))
  const series: RaceSeries[] = teams.map((team) => {
    const medal = podium.indexOf(team.id)
    const on = highlighted.includes(team.id)
    return {
      key: team.id,
      label: team.name,
      endLabel: medal >= 0 ? `${medal + 1}. ${team.name}` : team.name,
      color: !on ? null : medal >= 0 ? (MEDALS[medal] ?? null) : (EXTRAS[extras.indexOf(team.id)] ?? null),
      dashed: on && medal < 0,
    }
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('progressionHint')}>
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={s.color !== null}
            onClick={() => onToggle(s.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent',
              s.color ? 'border-foreground/40 font-semibold' : 'text-muted-foreground',
            )}
          >
            <span className="inline-block size-2.5 rounded-full" style={{ background: s.color ?? 'var(--muted-foreground)', opacity: s.color ? 1 : 0.4 }} />
            {s.label}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={onClear} disabled={highlighted.length === 0}>
          {t('clearHighlight')}
        </Button>
      </div>
      <RaceChart
        rows={rows}
        series={series}
        tickStep={3}
        title={(label) => t('weekOf', { date: label })}
        selected={selected === -1 ? null : selected}
        onSelect={(i) => {
          const week = progression[i]?.week
          if (week) onSelectWeek(week)
        }}
      />
    </div>
  )
}
