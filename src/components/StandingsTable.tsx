import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowDownUp } from 'lucide-react'
import { FormStrip } from '@/components/FormStrip'
import { Markers } from '@/components/Markers'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/hooks/prefs'
import type { MessageKey } from '@/i18n/dict'
import { sortRows } from '@/lib/filters'
import type { Match, StandingRow } from '@/lib/schema'
import { teamResults } from '@/lib/stats'
import type { StandingsSort, StandingsSortKey } from '@/lib/url-state'
import { cn } from '@/lib/utils'

type NumKey = StandingsSortKey

const COLS: { key: NumKey; short: MessageKey; long: MessageKey }[] = [
  { key: 'played', short: 'colMSZ', long: 'longMSZ' },
  { key: 'won', short: 'colGy', long: 'longGy' },
  { key: 'drawn', short: 'colD', long: 'longD' },
  { key: 'lost', short: 'colV', long: 'longV' },
  { key: 'goalsFor', short: 'colLG', long: 'longLG' },
  { key: 'goalsAgainst', short: 'colKG', long: 'longKG' },
  { key: 'goalDiff', short: 'colGK', long: 'longGK' },
  { key: 'points', short: 'colPont', long: 'longPont' },
]

type Props = {
  rows: readonly StandingRow[]
  matches: readonly Match[]
  teamName: (id: string) => string
  keep: string
  sort: StandingsSort
  onSort: (sort: StandingsSort) => void
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

export function StandingsTable({ rows, matches, teamName, keep, sort, onSort }: Props) {
  const t = useT()
  const key = sort.key
  const scroller = useRef<HTMLDivElement>(null)
  // Narrow screens: open scrolled to the right edge so the form column is visible; the position
  // and team columns are sticky on the left. DOM side effect only, runs once on mount.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])
  const sorted = key === 'position' ? rows : sortRows(rows, (r) => r[key], sort.dir)
  const toggle = (key: NumKey) =>
    onSort(sort.key === key ? (sort.dir === 'desc' ? { key, dir: 'asc' } : { key: 'position', dir: 'asc' }) : { key, dir: 'desc' })

  return (
    <div ref={scroller} className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full caption-bottom text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 w-7 bg-card px-1 text-center">{t('colPos')}</TableHead>
            <TableHead className="sticky left-7 z-20 w-full bg-card px-1">{t('colTeam')}</TableHead>
            {COLS.map((c) => (
              <TableHead
                key={c.key}
                className="px-0 text-right sm:px-1"
                aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn('inline-flex items-center gap-0.5 rounded px-1 py-0.5 hover:bg-accent', sort.key === c.key && 'text-primary')}
                      aria-label={t('sortBy', { col: t(c.long) })}
                    >
                      {t(c.short)}
                      {sort.key === c.key && <ArrowDownUp className="size-3" aria-hidden />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t(c.long)}</TooltipContent>
                </Tooltip>
              </TableHead>
            ))}
            <TableHead className="px-2 text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{t('form')}</span>
                </TooltipTrigger>
                <TooltipContent>{t('formHint')}</TooltipContent>
              </Tooltip>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const name = teamName(r.teamId)
            return (
              <TableRow key={r.teamId}>
                <TableCell className="tabular sticky left-0 z-10 bg-card px-1 text-center font-medium">{r.position}</TableCell>
                <TableCell className="sticky left-7 z-10 w-full max-w-28 bg-card px-1 py-1.5 sm:max-w-none">
                  <div className="flex items-center gap-1">
                    <div className="min-w-0">
                      <Link to={`/t/${encodeURIComponent(r.teamId)}${keep}`} className="block truncate hover:underline">
                        {name}
                      </Link>
                      <Markers markers={r.markers} />
                    </div>
                  </div>
                </TableCell>
                {COLS.map((c) => (
                  <TableCell key={c.key} className={cn('tabular w-7 px-0.5 text-right sm:px-1.5', c.key === 'points' && 'font-bold')}>
                    {c.key === 'goalDiff' ? signed(r.goalDiff) : r[c.key]}
                  </TableCell>
                ))}
                <TableCell className="px-2 [&_ol]:justify-end">
                  <FormStrip results={teamResults(r.teamId, matches).slice(-5)} teamName={teamName} keep={keep} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </table>
    </div>
  )
}
