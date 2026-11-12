import { Search } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { Input } from '@/components/ui/input'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useT } from '@/hooks/prefs'
import { useLeagueData } from '@/hooks/useLeagueData'
import { includesFolded } from '@/lib/filters'
import { aggregateScorers } from '@/lib/scorers'

export default function ScorersPage() {
  const t = useT()
  const { query, teamName, params, setSelection, seasonId, league, noData } = useLeagueData()
  const q = params.get('q') ?? ''

  return (
    <div className="space-y-4">
      <PageHeader title={t('scorersTitle')} />
      <QueryBoundary query={query} idle={noData || seasonId === null || league === null}>
        {(data) => {
          const { rows, coverage } = aggregateScorers(data.matches)
          const shown = rows.filter((r) => includesFolded(r.name, q) || includesFolded(teamName(r.teamId), q))
          return (
            <>
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {t('scorersCoverage', { with: coverage.withScorers, played: coverage.played })}
              </p>
              <label className="relative block max-w-sm">
                <span className="sr-only">{t('search')}</span>
                <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  value={q}
                  placeholder={t('searchPlaceholder')}
                  className="pl-8"
                  onChange={(e) => setSelection({ extra: { q: e.target.value } })}
                />
              </label>
              {shown.length === 0 ? (
                <EmptyState>{rows.length === 0 ? t('scorersEmpty') : t('emptyFilter')}</EmptyState>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>{t('player')}</TableHead>
                        <TableHead>{t('team')}</TableHead>
                        <TableHead className="text-right">{t('goals')}</TableHead>
                        <TableHead className="text-right">{t('matchesScoredIn')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shown.map((r) => (
                        <TableRow key={`${r.teamId}-${r.name}`}>
                          <TableCell className="tabular text-center">{r.rank}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell className="text-muted-foreground">{teamName(r.teamId)}</TableCell>
                          <TableCell className="tabular text-right font-bold">{r.goals}</TableCell>
                          <TableCell className="tabular text-right">{r.matches}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </table>
                </div>
              )}
            </>
          )
        }}
      </QueryBoundary>
    </div>
  )
}
