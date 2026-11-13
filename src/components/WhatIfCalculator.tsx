import { ArrowDown, ArrowUp, Minus, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrefs, useT } from '@/hooks/prefs'
import type { LeagueData } from '@/lib/data'
import { formatKickoffShort } from '@/lib/format'
import { isPlayed } from '@/lib/standings'
import { whatIfTable } from '@/lib/whatif'
import type { WhatIf } from '@/lib/whatif'
import { cn } from '@/lib/utils'

type Props = { data: LeagueData; keep: string; value: WhatIf; onChange: (next: WhatIf) => void }

const QUICK: [string, [number, number]][] = [
  ['1', [1, 0]],
  ['X', [1, 1]],
  ['2', [0, 1]],
]

function Change({ n }: { n: number }) {
  const t = useT()
  if (n === 0) return <Minus className="mx-auto size-3.5 text-muted-foreground" aria-label={`${t('change')}: 0`} />
  const Up = n > 0
  const Icon = Up ? ArrowUp : ArrowDown
  return (
    <span className={cn('inline-flex items-center text-xs font-semibold', Up ? 'text-win' : 'text-loss')} aria-label={`${t('change')}: ${n > 0 ? '+' : ''}${n}`}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(n)}
    </span>
  )
}

/** Enter scores for open matches and see the rule-ranked table update immediately. */
export default function WhatIfCalculator({ data, keep, value, onChange }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const name = new Map(data.teams.map((x) => [x.id, x.name]))
  const open = data.matches.filter((m) => !isPlayed(m)).sort((a, b) => (a.kickoff ?? '').localeCompare(b.kickoff ?? ''))
  const table = whatIfTable(data.teams, data.matches, data.standings, value)
  const set = (id: string, score: [number, number] | null) => {
    const next = new Map(value)
    if (score) next.set(id, score)
    else next.delete(id)
    onChange(next)
  }
  const setSide = (id: string, side: 0 | 1, raw: string) => {
    const current = value.get(id)
    if (raw === '' && (!current || current[side === 0 ? 1 : 0] === 0)) return set(id, null)
    const n = Math.max(0, Math.min(99, Number.parseInt(raw || '0', 10) || 0))
    const score: [number, number] = side === 0 ? [n, current?.[1] ?? 0] : [current?.[0] ?? 0, n]
    set(id, score)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="overflow-x-auto rounded-xl border bg-card lg:sticky lg:top-28 lg:order-2">
        <table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead className="w-8 text-center">
                <span className="sr-only">{t('change')}</span>
              </TableHead>
              <TableHead className="w-full">{t('team')}</TableHead>
              <TableHead className="text-right">{t('colMSZ')}</TableHead>
              <TableHead className="text-right">{t('colGK')}</TableHead>
              <TableHead className="text-right">{t('colPont')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.map((r) => (
              <TableRow key={r.teamId}>
                <TableCell className="tabular text-center font-medium">{r.position}</TableCell>
                <TableCell className="text-center">
                  <Change n={r.change} />
                </TableCell>
                <TableCell className="max-w-40 truncate">
                  <Link to={`/t/${encodeURIComponent(r.teamId)}${keep}`} className="hover:underline">
                    {name.get(r.teamId)}
                  </Link>
                </TableCell>
                <TableCell className="tabular text-right">{r.played}</TableCell>
                <TableCell className="tabular text-right">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</TableCell>
                <TableCell className="tabular text-right font-bold">{r.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>

      <div className="space-y-2 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{t('whatIfEntered', { n: value.size })}</p>
          <Button variant="outline" size="sm" onClick={() => onChange(new Map())} disabled={value.size === 0}>
            <RotateCcw aria-hidden />
            {t('whatIfReset')}
          </Button>
        </div>
        {open.length === 0 && <p className="text-sm text-muted-foreground">{t('whatIfNone')}</p>}
        <ul className="divide-y rounded-xl border bg-card">
          {open.map((m) => {
            const score = value.get(m.id)
            const home = name.get(m.homeTeamId) ?? m.homeTeamId
            const away = name.get(m.awayTeamId) ?? m.awayTeamId
            return (
              <li key={m.id} className={cn('space-y-1.5 px-3 py-2', score && 'bg-primary/5')}>
                <p className="text-center text-[11px] text-muted-foreground">
                  {formatKickoffShort(m.kickoff, prefs.locale, prefs.timeZone) ?? t('noKickoff')}
                  {m.status === 'unknown' && ` · ${t('noResult')}`}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="line-clamp-2 text-right hyphens-auto">{home}</span>
                  <span className="flex items-center gap-1">
                    {([0, 1] as const).map((side) => (
                      <Input
                        key={side}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99}
                        value={score ? score[side] : ''}
                        onChange={(e) => setSide(m.id, side, e.target.value)}
                        aria-label={`${side === 0 ? home : away}: ${t(side === 0 ? 'homeGoals' : 'awayGoals')}`}
                        className="tabular h-8 w-11 px-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                  </span>
                  <span className="line-clamp-2 hyphens-auto">{away}</span>
                </div>
                <div className="flex justify-center gap-1">
                  {QUICK.map(([label, s]) => {
                    const on = score?.[0] === s[0] && score[1] === s[1]
                    return (
                      <Button key={label} size="sm" variant={on ? 'secondary' : 'ghost'} className="h-7 w-9" aria-pressed={on} onClick={() => set(m.id, on ? null : s)}>
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
