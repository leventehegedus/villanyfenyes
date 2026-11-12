import { PageHeader } from '@/components/PageHeader'
import { QueryBoundary } from '@/components/QueryBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/hooks/prefs'
import { useHallOfFame } from '@/hooks/queries'
import { SOURCE_SITE } from '@/lib/config'

export default function HallOfFamePage() {
  const t = useT()
  const query = useHallOfFame()
  return (
    <div className="space-y-4">
      <PageHeader title={t('hofTitle')} picker={false}>
        <p className="text-sm text-muted-foreground">{t('hofNote')}</p>
      </PageHeader>
      <QueryBoundary query={query}>
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.tables.map((table) => (
              <Card key={table.key}>
                <CardHeader>
                  <CardTitle className="text-base">{table.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1 text-sm">
                    {table.rows.map((r, i) => (
                      <li key={`${r.name}-${i}`} className="flex justify-between gap-2">
                        <span>
                          <span className="tabular mr-2 text-muted-foreground">{i + 1}.</span>
                          {r.name}
                        </span>
                        <span className="tabular font-semibold">{r.value}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </QueryBoundary>
      <a href={`${SOURCE_SITE}/hiressegek-csarnoka`} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-2">
        {t('officialPage')}
      </a>
    </div>
  )
}
