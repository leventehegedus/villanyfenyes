import { RaceChart } from '@/components/RaceChart'
import { usePrefs, useT } from '@/hooks/prefs'
import { formatDay } from '@/lib/format'
import { scorerRace } from '@/lib/players'
import type { Match } from '@/lib/schema'

const SLOTS = Array.from({ length: 5 }, (_, i) => `var(--series-${i + 1})`)

/** Cumulative goals of the top five scorers, week by week. */
export default function ScorerRaceChart({ matches, teamName }: { matches: readonly Match[]; teamName: (id: string) => string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const race = scorerRace(matches, SLOTS.length)
  if (race.players.length === 0) return null
  const rows = race.rows.map((r) => ({ label: formatDay(`${r.week}T12:00:00Z`, prefs.locale, 'UTC'), values: r.values }))
  const series = race.players.map((p, i) => ({
    key: p.key,
    label: `${p.name} (${teamName(p.teamId)})`,
    endLabel: p.name,
    color: SLOTS[i] ?? null,
  }))
  return (
    <section className="space-y-1">
      <h2 className="text-lg font-semibold">{t('scorerRace')}</h2>
      <RaceChart rows={rows} series={series} tickStep={2} title={(label) => t('weekOf', { date: label })} />
    </section>
  )
}
