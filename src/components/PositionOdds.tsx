import { useMemo } from 'react'
import { Link } from 'react-router'
import { usePrefs, useT } from '@/hooks/prefs'
import type { LeagueData } from '@/lib/data'
import { positionBounds, simulateFinish } from '@/lib/projection'
import { cn } from '@/lib/utils'

const SIMS = 5000

/** Heatmap: rows are teams (site order), columns final positions; one hue, darker = likelier. */
export default function PositionOdds({ data, keep }: { data: LeagueData; keep: string }) {
  const t = useT()
  const { prefs } = usePrefs()
  const order = useMemo(() => [...data.standings].sort((a, b) => a.position - b.position).map((r) => r.teamId), [data.standings])
  const { sim, bounds } = useMemo(
    () => ({ sim: simulateFinish(order, data.matches, { sims: SIMS, seed: 1 }), bounds: positionBounds(order, data.matches) }),
    [order, data.matches],
  )
  const name = new Map(data.teams.map((x) => [x.id, x.name]))
  const pct = new Intl.NumberFormat(prefs.locale, { style: 'percent', maximumFractionDigits: 0 })
  const positions = order.map((_, i) => i + 1)

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{t('oddsHint', { sims: new Intl.NumberFormat(prefs.locale).format(SIMS) })}</p>
      <p className="text-sm">{sim.remaining > 0 ? t('oddsRemaining', { remaining: sim.remaining }) : t('oddsDone')}</p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium">{t('team')}</th>
              <th className="px-2 py-2 font-medium" title={t('reachableHint')}>
                {t('reachable')}
              </th>
              {positions.map((n) => (
                <th key={n} scope="col" className="tabular w-10 px-0.5 py-2 text-center font-medium">
                  {t('positionShort', { n })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.map((id) => {
              const b = bounds.get(id) ?? { best: 1, worst: positions.length }
              const counts = sim.counts.get(id) ?? []
              const top = Math.max(...counts)
              return (
                <tr key={id} className="border-b last:border-0">
                  <th scope="row" className="sticky left-0 z-10 max-w-36 truncate bg-card px-2 py-1 text-left font-normal">
                    <Link to={`/t/${encodeURIComponent(id)}${keep}`} className="hover:underline">
                      {name.get(id)}
                    </Link>
                  </th>
                  <td className="tabular px-2 text-center whitespace-nowrap text-muted-foreground">
                    {b.best === b.worst ? `${b.best}.` : `${b.best}.–${b.worst}.`}
                  </td>
                  {positions.map((n) => {
                    const p = (counts[n - 1] ?? 0) / sim.sims
                    const inside = n >= b.best && n <= b.worst
                    const label = !inside ? t('oddsImpossible') : p === 0 ? t('oddsNotSeen') : pct.format(p)
                    return (
                      <td key={n} className="p-0.5">
                        <div
                          title={t('oddsCell', { team: name.get(id) ?? id, n, p: label })}
                          aria-label={t('oddsCell', { team: name.get(id) ?? id, n, p: label })}
                          className={cn(
                            'tabular grid h-7 place-items-center rounded-sm',
                            !inside && 'bg-muted/60',
                            p > 0.45 ? 'font-semibold text-white' : 'text-foreground',
                            p > 0 && counts[n - 1] === top && 'ring-1 ring-foreground/40',
                          )}
                          style={inside && p > 0 ? { background: `color-mix(in oklab, var(--seq) ${Math.round(12 + p * 88)}%, var(--card))` } : undefined}
                        >
                          {!inside ? '' : p === 0 ? '·' : p < 0.005 ? '<1' : Math.round(p * 100)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
