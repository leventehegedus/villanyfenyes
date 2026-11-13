import { Link } from 'react-router'
import { Stat } from '@/components/Stat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrefs, useT } from '@/hooks/prefs'
import { opponentHighlights, rates } from '@/lib/alltime'
import type { TeamAllTimeData } from '@/lib/data'
import { formatDecimal } from '@/lib/format'

type Props = { file: TeamAllTimeData; teamName: (id: string) => string }

const MIN_MATCHES = 3
const teamLink = (id: string) => `/t/${encodeURIComponent(id)}/osszes`

/** Head-to-head per opponent, most played first, with the three highlights on top. */
export function Opponents({ file, teamName }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const missing = t('noData')
  const h = opponentHighlights(file, MIN_MATCHES)
  const rows = [...file.opponents].sort((x, y) => y.totals.played - x.totals.played || x.name.localeCompare(y.name, 'hu'))
  // A link keeps every highlight tile the same size, whatever the name length.
  const name = (id: string | null) =>
    id ? (
      <Link to={teamLink(id)} className="text-sm hover:underline">
        {teamName(id)}
      </Link>
    ) : null
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('opponents')}</h2>
        </CardTitle>
        <CardDescription>{t('minMatchesNote', { n: MIN_MATCHES })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat label={t('mostPlayed')} value={name(h.mostPlayed)} missing={missing} />
          <Stat label={t('favourite')} value={name(h.favourite)} missing={missing} />
          <Stat label={t('bogey')} value={name(h.bogey)} missing={missing} />
        </dl>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('opponent')}</TableHead>
                <TableHead className="text-right">{t('colMSZ')}</TableHead>
                <TableHead className="text-right">{`${t('colGy')}-${t('colD')}-${t('colV')}`}</TableHead>
                <TableHead className="text-right">{t('goals')}</TableHead>
                <TableHead className="text-right">{t('pointsPerMatch')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.teamId}>
                  <TableCell>
                    <Link to={teamLink(o.teamId)} className="hover:underline">
                      {o.name}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular text-right">{o.totals.played}</TableCell>
                  <TableCell className="tabular text-right">{`${o.totals.won}-${o.totals.drawn}-${o.totals.lost}`}</TableCell>
                  <TableCell className="tabular text-right">{`${o.totals.goalsFor}:${o.totals.goalsAgainst}`}</TableCell>
                  <TableCell className="tabular text-right">{formatDecimal(rates(o.totals).pointsPerMatch, prefs.locale) ?? missing}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** All-time scorers of the team; coverage says how many matches have scorer data at all. */
export function AllTimeScorers({ file }: { file: TeamAllTimeData }) {
  const t = useT()
  const { playedMatches, coveredMatches, rows } = file.scorers
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('scorers')}</h2>
        </CardTitle>
        <CardDescription>
          {t('scorerCoverage', { covered: coveredMatches, played: playedMatches })} {t('computedNote')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {coveredMatches === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <>
            <p className="text-sm">
              {t('distinctScorers')}: <span className="tabular font-semibold">{rows.length}</span>
            </p>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>{t('player')}</TableHead>
                    <TableHead className="text-right">{t('goals')}</TableHead>
                    <TableHead className="text-right">{t('matchesScoredIn')}</TableHead>
                    <TableHead className="text-right">{t('hatTricks')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.name}>
                      <TableCell className="tabular text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="tabular text-right font-semibold">{r.goals}</TableCell>
                      <TableCell className="tabular text-right">{r.matches}</TableCell>
                      <TableCell className="tabular text-right">{r.hatTricks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
