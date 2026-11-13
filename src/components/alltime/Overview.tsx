import { Stat } from '@/components/Stat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePrefs, useT } from '@/hooks/prefs'
import { honours, leagueTotals, overall, rates } from '@/lib/alltime'
import type { TeamAllTimeData } from '@/lib/data'
import { formatDecimal } from '@/lib/format'
import type { AllTimeTotals } from '@/lib/schema'
import type { MessageKey } from '@/i18n/dict'

type Props = { file: TeamAllTimeData }

export function AllTimeHeader({ file }: Props) {
  const t = useT()
  const [name = file.teamId, ...former] = file.names
  const first = file.seasons.at(-1)
  const last = file.seasons[0]
  return (
    <header>
      <h1 className="font-heading text-2xl font-bold tracking-tight">{name}</h1>
      <p className="text-sm text-muted-foreground">
        {t('allTimeTitle')}
        {first && last && ` · ${first.label} – ${last.label}`}
      </p>
      {former.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('formerNames')}: {former.join(', ')}
        </p>
      )}
    </header>
  )
}

export function Honours({ file }: Props) {
  const t = useT()
  const missing = t('noData')
  return (
    <section aria-labelledby="honours" className="space-y-2">
      <h2 id="honours" className="text-lg font-semibold">
        {t('honours')}
      </h2>
      {honours(file).map((h) => (
        <div key={h.league}>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{h.league}</p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t('titles')} value={h.titles} missing={missing} />
            <Stat label={t('podiums')} value={h.podiums} missing={missing} />
            <Stat label={t('promotions')} value={h.promotions} missing={missing} />
            <Stat label={t('relegations')} value={h.relegations} missing={missing} />
          </dl>
        </div>
      ))}
    </section>
  )
}

function TotalsCells({ totals }: { totals: AllTimeTotals }) {
  const { prefs } = usePrefs()
  const missing = useT()('noData')
  const r = rates(totals)
  const dec = (n: number | null) => formatDecimal(n, prefs.locale) ?? missing
  return (
    <>
      {[totals.played, totals.won, totals.drawn, totals.lost, `${totals.goalsFor}:${totals.goalsAgainst}`, r.goalDiff, totals.points].map((v, i) => (
        <TableCell key={i} className="tabular text-right">
          {v}
        </TableCell>
      ))}
      <TableCell className="tabular text-right">{dec(r.winPct === null ? null : Math.round(r.winPct))}</TableCell>
      <TableCell className="tabular text-right">{dec(r.pointsPerMatch)}</TableCell>
    </>
  )
}

export function LeagueTotals({ file }: Props) {
  const t = useT()
  const heads: [MessageKey, MessageKey][] = [
    ['colMSZ', 'longMSZ'],
    ['colGy', 'longGy'],
    ['colD', 'longD'],
    ['colV', 'longV'],
    ['goals', 'goals'],
    ['colGK', 'longGK'],
    ['colPont', 'longPont'],
    ['winPct', 'winPct'],
    ['pointsPerMatch', 'pointsPerMatch'],
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('byLeague')}</h2>
        </CardTitle>
        <CardDescription>{t('allTimeNote')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('league')}</TableHead>
              <TableHead className="text-right">{t('seasonsPlayed')}</TableHead>
              {heads.map(([short, long]) => (
                <TableHead key={short} className="text-right" title={t(long)}>
                  {t(short)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leagueTotals(file).map((l) => (
              <TableRow key={l.league}>
                <TableCell className="font-medium">{l.league}</TableCell>
                <TableCell className="tabular text-right">{l.seasons}</TableCell>
                <TotalsCells totals={l.totals} />
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>{t('total')}</TableCell>
              <TableCell className="tabular text-right">{file.seasons.length}</TableCell>
              <TotalsCells totals={overall(file)} />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
