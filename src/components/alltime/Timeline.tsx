import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrefs, useT } from '@/hooks/prefs'
import { bestWorstSeason, rates } from '@/lib/alltime'
import type { TeamAllTimeData } from '@/lib/data'
import { formatDecimal } from '@/lib/format'

/** One row per season, newest first: league, final position, marker and points per match. */
export function Timeline({ file }: { file: TeamAllTimeData }) {
  const t = useT()
  const { prefs } = usePrefs()
  const missing = t('noData')
  const { best, worst } = bestWorstSeason(file)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('timeline')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[28rem] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('season')}</TableHead>
              <TableHead>{t('league')}</TableHead>
              <TableHead className="text-right">{t('position')}</TableHead>
              <TableHead className="text-right">{t('colPont')}</TableHead>
              <TableHead className="text-right">{t('pointsPerMatch')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {file.seasons.map((s) => (
              <TableRow key={`${s.seasonId}-${s.league}`}>
                <TableCell className="font-medium">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {s.label}
                    {!s.finished && <Badge variant="outline">{t('inProgress')}</Badge>}
                    {s.seasonId === best && <Badge className="bg-win text-white">{t('bestSeason')}</Badge>}
                    {s.seasonId === worst && best !== worst && <Badge variant="destructive">{t('worstSeason')}</Badge>}
                  </span>
                </TableCell>
                <TableCell>{s.league}</TableCell>
                <TableCell className="tabular text-right">
                  {s.position === null ? missing : `${s.position}. / ${s.teamsInLeague}`}
                  {s.marker && <span className="ml-1">{s.marker === 'promotion' ? '↑' : '↓'}</span>}
                </TableCell>
                <TableCell className="tabular text-right">{s.totals.points}</TableCell>
                <TableCell className="tabular text-right">{formatDecimal(rates(s.totals).pointsPerMatch, prefs.locale) ?? missing}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
