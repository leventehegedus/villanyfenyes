import { Link } from 'react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { OUTCOME_STYLE } from '@/components/outcome-style'
import { useT } from '@/hooks/prefs'
import type { LeagueData } from '@/lib/data'
import { crossTable } from '@/lib/stats'
import { cn } from '@/lib/utils'

const TINT = { W: 'bg-win/15', D: 'bg-draw/15', L: 'bg-loss/15' } as const

/** Every pairing in standings order; each cell shows the row team's result against the column team. */
export function CrossTable({ data, keep }: { data: LeagueData; keep: string }) {
  const t = useT()
  const order = [...data.standings].sort((a, b) => a.position - b.position).map((r) => r.teamId)
  const name = new Map(data.teams.map((x) => [x.id, x.name]))
  const cell = crossTable(data.teams, data.matches)

  return (
    <div className="max-h-[75svh] overflow-auto rounded-xl border bg-card">
      <table className="text-xs">
        <thead className="sticky top-0 z-20 bg-card">
          <tr>
            <th className="sticky left-0 z-20 bg-card px-2 py-2 text-left font-medium">{t('team')}</th>
            {order.map((id, i) => (
              <th key={id} scope="col" className="w-10 px-1 py-2 text-center font-medium">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label={name.get(id)} className="tabular rounded px-1">
                      {i + 1}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{name.get(id)}</TooltipContent>
                </Tooltip>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.map((row, i) => (
            <tr key={row} className="border-t">
              <th scope="row" className="sticky left-0 z-10 max-w-36 truncate bg-card px-2 py-1.5 text-left font-normal">
                <span className="tabular mr-1 text-muted-foreground">{i + 1}.</span>
                <Link to={`/t/${encodeURIComponent(row)}${keep}`} className="hover:underline">
                  {name.get(row)}
                </Link>
              </th>
              {order.map((col) => {
                if (row === col) return <td key={col} className="bg-muted" aria-hidden />
                const results = cell(row, col)
                return (
                  <td key={col} className="px-0.5 py-0.5 text-center">
                    {results.length === 0 ? (
                      <span className="text-muted-foreground" aria-label={t('notPlayedYet')}>·</span>
                    ) : (
                      results.map((r) => (
                        <Link
                          key={r.matchId}
                          to={`/m/${encodeURIComponent(r.matchId)}${keep}`}
                          aria-label={`${name.get(row)} – ${name.get(col)} ${r.goalsFor}:${r.goalsAgainst}, ${t(OUTCOME_STYLE[r.outcome].label)}`}
                          className={cn('tabular block rounded px-1 py-1 font-mono font-semibold hover:ring-1 hover:ring-foreground/30', TINT[r.outcome])}
                        >
                          {r.goalsFor}:{r.goalsAgainst}
                        </Link>
                      ))
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
