import { Suspense, lazy } from 'react'
import { CrossTable } from '@/components/CrossTable'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ListSkeleton, QueryBoundary } from '@/components/QueryBoundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { isPlayed } from '@/lib/standings'
import { readHighlight, toggleHighlight, writeHighlight } from '@/lib/url-state'
import { parseWhatIf, serialiseWhatIf } from '@/lib/whatif'

const LeagueProgressionChart = lazy(() => import('@/components/LeagueProgressionChart'))
const PositionOdds = lazy(() => import('@/components/PositionOdds'))
const WhatIfCalculator = lazy(() => import('@/components/WhatIfCalculator'))

export default function StatsPage() {
  const t = useT()
  const { query, keep, params, setSelection, seasonId, league, noData } = useLeagueData()
  const rawView = params.get('v')
  const view = rawView === 'cross' || rawView === 'odds' || rawView === 'whatif' ? rawView : 'progress'

  return (
    <div className="space-y-4">
      <PageHeader title={t('statsTitle')}>
        <p className="text-sm text-muted-foreground">{t('computedNote')}</p>
      </PageHeader>
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          if (!data.matches.some(isPlayed)) return <EmptyState>{t('scorersEmpty')}</EmptyState>
          const teamIds = data.teams.map((x) => x.id)
          const podium = [...data.standings].sort((a, b) => a.position - b.position).slice(0, 3).map((r) => r.teamId)
          const highlighted = readHighlight(params.get('h'), teamIds, podium)
          const setHighlight = (ids: string[]) => setSelection({ extra: { h: writeHighlight(ids) } })
          return (
            <Tabs value={view} onValueChange={(v) => setSelection({ extra: { v: v === 'progress' ? null : v } })}>
              <TabsList className="max-w-full overflow-x-auto">
                <TabsTrigger value="progress">{t('tabProgress')}</TabsTrigger>
                <TabsTrigger value="cross">{t('tabCross')}</TabsTrigger>
                <TabsTrigger value="odds">{t('tabOdds')}</TabsTrigger>
                <TabsTrigger value="whatif">{t('whatIfTab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="progress" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('progressionTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('progressionHint')}</p>
                <Suspense fallback={<ListSkeleton rows={4} />}>
                  <LeagueProgressionChart
                    teams={data.teams}
                    matches={data.matches}
                    podium={podium}
                    highlighted={highlighted}
                    onToggle={(id) => setHighlight(toggleHighlight(highlighted, id))}
                    onClear={() => setHighlight([])}
                  />
                </Suspense>
              </TabsContent>
              <TabsContent value="cross" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('crossTable')}</h2>
                <p className="text-sm text-muted-foreground">{t('crossTableHint')}</p>
                <CrossTable data={data} keep={keep} />
              </TabsContent>
              <TabsContent value="odds" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('oddsTitle')}</h2>
                <Suspense fallback={<ListSkeleton rows={6} />}>
                  <PositionOdds data={data} keep={keep} />
                </Suspense>
              </TabsContent>
              <TabsContent value="whatif" className="space-y-2 pt-2">
                <h2 className="text-lg font-semibold">{t('whatIfTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('whatIfHint')}</p>
                <Suspense fallback={<ListSkeleton rows={6} />}>
                  <WhatIfCalculator
                    data={data}
                    keep={keep}
                    value={parseWhatIf(params.get('w'))}
                    onChange={(w) => setSelection({ extra: { w: serialiseWhatIf(w) || null } })}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
