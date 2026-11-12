import { Suspense, lazy } from 'react'
import { Shield, Target } from 'lucide-react'
import { Link } from 'react-router'
import { CrossTable } from '@/components/CrossTable'
import { FormStrip } from '@/components/FormStrip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ListSkeleton, QueryBoundary } from '@/components/QueryBoundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFavourites, usePrefs, useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import type { MessageKey } from '@/i18n/dict'
import type { LeagueData } from '@/lib/data'
import { sortRows } from '@/lib/filters'
import { formatDecimal } from '@/lib/format'
import { headToHead, leagueTable } from '@/lib/stats'
import type { LeagueStatsRow } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { readHighlight, toggleHighlight } from '@/lib/url-state'

const LeagueProgressionChart = lazy(() => import('@/components/LeagueProgressionChart'))

type SortKey = 'played' | 'goalsForPerMatch' | 'goalsAgainstPerMatch' | 'goalDiff' | 'cleanSheets' | 'points'
const COLS: { key: SortKey; label: MessageKey; asc?: boolean }[] = [
  { key: 'played', label: 'played' },
  { key: 'points', label: 'points' },
  { key: 'goalsForPerMatch', label: 'goalsForPerMatch' },
  { key: 'goalsAgainstPerMatch', label: 'goalsAgainstPerMatch', asc: true },
  { key: 'goalDiff', label: 'goalDiff' },
  { key: 'cleanSheets', label: 'cleanSheets' },
]
const isSortKey = (v: string | null): v is SortKey => COLS.some((c) => c.key === v)

function HeadToHead({ data, a, b, onPick }: { data: LeagueData; a: string | null; b: string | null; onPick: (k: 'a' | 'b', v: string) => void }) {
  const t = useT()
  const teams = [...data.teams].sort((x, y) => x.name.localeCompare(y.name, 'hu'))
  const pick = (k: 'a' | 'b', value: string | null) => (
    <Select value={value ?? ''} onValueChange={(v) => onPick(k, v)}>
      <SelectTrigger aria-label={t('team')} className="min-w-40">
        <SelectValue placeholder={t('team')} />
      </SelectTrigger>
      <SelectContent>
        {teams.map((x) => (
          <SelectItem key={x.id} value={x.id}>
            {x.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const h = a && b ? headToHead(a, b, data.matches) : null
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('headToHead')}</CardTitle>
        <CardDescription>{t('computedNote')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {pick('a', a)} <span aria-hidden>–</span> {pick('b', b)}
        </div>
        {!h ? (
          <p className="text-sm text-muted-foreground">{t('pickTwoTeams')}</p>
        ) : h.results.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('h2hNone')}</p>
        ) : (
          <p className="tabular text-sm">
            {t('win')}: {h.wins} · {t('draw')}: {h.draws} · {t('loss')}: {h.losses} · {t('goals')}: {h.goalsFor}:{h.goalsAgainst}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function StatsPage() {
  const t = useT()
  const { prefs } = usePrefs()
  const { favourites } = useFavourites()
  const { query, keep, params, setSelection, seasonId, league, noData, teamName } = useLeagueData()
  const raw = params.get('o')
  const sortKey: SortKey = isSortKey(raw) ? raw : 'points'
  const col = COLS.find((c) => c.key === sortKey)
  const value = (r: LeagueStatsRow, k: SortKey) => r[k]
  const rawView = params.get('v')
  const view = rawView === 'cross' || rawView === 'compare' ? rawView : 'progress'

  return (
    <div className="space-y-4">
      <PageHeader title={t('statsTitle')}>
        <p className="text-sm text-muted-foreground">{t('computedNote')}</p>
      </PageHeader>
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          const rows = sortRows(leagueTable(data.teams, data.matches), (r) => value(r, sortKey), col?.asc ? 'asc' : 'desc')
          if (rows.every((r) => r.played === 0)) return <EmptyState>{t('scorersEmpty')}</EmptyState>
          const teamIds = data.teams.map((x) => x.id)
          const favs = favourites.filter((id) => teamIds.includes(id))
          const leaders = [...data.standings].sort((a, b) => a.position - b.position).slice(0, 3).map((r) => r.teamId)
          const highlighted = readHighlight(params.get('h'), teamIds, favs.length > 0 ? favs : leaders)
          return (
            <Tabs value={view} onValueChange={(v) => setSelection({ extra: { v } })}>
              <TabsList className="max-w-full overflow-x-auto">
                <TabsTrigger value="progress">{t('tabProgress')}</TabsTrigger>
                <TabsTrigger value="cross">{t('tabCross')}</TabsTrigger>
                <TabsTrigger value="compare">{t('tabCompare')}</TabsTrigger>
              </TabsList>
              <TabsContent value="progress" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('progressionTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('progressionHint')}</p>
                <Suspense fallback={<ListSkeleton rows={4} />}>
                  <LeagueProgressionChart
                    teams={data.teams}
                    matches={data.matches}
                    highlighted={highlighted}
                    onToggle={(id) => setSelection({ extra: { h: toggleHighlight(highlighted, id).join(',') } })}
                  />
                </Suspense>
              </TabsContent>
              <TabsContent value="cross" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('crossTable')}</h2>
                <p className="text-sm text-muted-foreground">{t('crossTableHint')}</p>
                <CrossTable data={data} keep={keep} />
              </TabsContent>
              <TabsContent value="compare" className="space-y-4 pt-2">
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="w-full text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">{t('team')}</TableHead>
                      {COLS.map((c) => (
                        <TableHead key={c.key} className="text-right" aria-sort={c.key === sortKey ? (c.asc ? 'ascending' : 'descending') : 'none'}>
                          <button
                            type="button"
                            className={cn('rounded px-1 hover:bg-accent', c.key === sortKey && 'text-primary')}
                            onClick={() => setSelection({ extra: { o: c.key } })}
                          >
                            {t(c.label)}
                          </button>
                        </TableHead>
                      ))}
                      <TableHead>{t('form')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.teamId}>
                        <TableCell className="sticky left-0 max-w-44 bg-card">
                          <Link to={`/t/${encodeURIComponent(r.teamId)}${keep}`} className="block truncate hover:underline">
                            {r.name}
                          </Link>
                          <span className="flex gap-2 text-[11px] text-muted-foreground">
                            {r.bestAttack && (
                              <span className="inline-flex items-center gap-0.5"><Target className="size-3" aria-hidden />{t('bestAttack')}</span>
                            )}
                            {r.bestDefence && (
                              <span className="inline-flex items-center gap-0.5"><Shield className="size-3" aria-hidden />{t('bestDefence')}</span>
                            )}
                          </span>
                        </TableCell>
                        {COLS.map((c) => (
                          <TableCell key={c.key} className="tabular text-right">
                            {r.played === 0 && c.key !== 'played' ? t('noData') : (formatDecimal(r[c.key], prefs.locale) ?? t('noData'))}
                          </TableCell>
                        ))}
                        <TableCell>
                          <FormStrip results={r.recent} teamName={teamName} keep={keep} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
              <HeadToHead data={data} a={params.get('a')} b={params.get('b')} onPick={(k, v) => setSelection({ extra: { [k]: v } })} />
              </TabsContent>
            </Tabs>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
