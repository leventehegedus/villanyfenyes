import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DEFAULT_PREFS, usePrefs, useT } from '@/hooks/prefs'
import { useMeta } from '@/hooks/queries'
import { useSelection } from '@/hooks/useSelection'
import { SOURCE_SITE } from '@/lib/config'
import { formatKickoff } from '@/lib/format'
import { clearAllStored } from '@/lib/storage'
import { SITE_TIME_ZONE } from '@/lib/time'

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const ZONES = [...new Set([SITE_TIME_ZONE, browserZone, 'UTC'])]

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}

/** Bytes of /data/*.json fetched in this page view (Resource Timing). */
function dataPayloadBytes(): number {
  return performance
    .getEntriesByType('resource')
    .filter((e): e is PerformanceResourceTiming => 'encodedBodySize' in e && e.name.includes('/data/'))
    .reduce((n, e) => n + e.encodedBodySize, 0)
}

function Diagnostics() {
  const t = useT()
  const { prefs } = usePrefs()
  const meta = useMeta().data
  if (!meta) return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  const items: [string, ReactNode][] = [
    [t('generatedAt'), formatKickoff(meta.generatedAt, prefs.locale, prefs.timeZone)],
    [t('requests'), meta.requests],
    [t('skippedRows'), meta.skippedRows.count],
    [t('pendingDetails'), meta.pendingMatchDetails],
    [t('mismatches'), meta.mismatches.length],
    [t('payloadSize'), `${new Intl.NumberFormat(prefs.locale).format(Math.round(dataPayloadBytes() / 1024))} kB`],
  ]
  const details = [...meta.skippedRows.reasons, ...meta.warnings, ...meta.mismatches.map((m) => `${m.league} ${m.teamId} ${m.field}: ${m.site} ≠ ${m.computed}`)]
  return (
    <>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        {items.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {details.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer">{t('warnings')} ({details.length})</summary>
          <ul className="mt-1 max-h-48 list-disc overflow-auto pl-4 font-mono">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

export default function SettingsPage() {
  const t = useT()
  const { prefs, update } = usePrefs()
  const { seasonId, league, season } = useSelection()
  const hasDefault = prefs.defaultSeason !== null

  return (
    <div className="space-y-4">
      <PageHeader title={t('settingsTitle')} picker={false} />
      <Card>
        <CardContent className="divide-y">
          <Row label={t('language')}>
            <ToggleGroup type="single" variant="outline" value={prefs.locale} onValueChange={(v) => (v === 'hu' || v === 'en') && update({ locale: v })}>
              <ToggleGroupItem value="hu">Magyar</ToggleGroupItem>
              <ToggleGroupItem value="en">English</ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label={t('theme')}>
            <ToggleGroup type="single" variant="outline" value={prefs.theme} onValueChange={(v) => (v === 'system' || v === 'light' || v === 'dark') && update({ theme: v })}>
              <ToggleGroupItem value="system">{t('themeSystem')}</ToggleGroupItem>
              <ToggleGroupItem value="light">{t('themeLight')}</ToggleGroupItem>
              <ToggleGroupItem value="dark">{t('themeDark')}</ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label={t('timeZone')}>
            <Select value={prefs.timeZone} onValueChange={(v) => update({ timeZone: v })}>
              <SelectTrigger aria-label={t('timeZone')} className="min-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label={t('defaultSelection')}>
            <div className="flex flex-wrap gap-2">
              <Button variant={hasDefault ? 'outline' : 'secondary'} size="sm" onClick={() => update({ defaultSeason: null, defaultLeague: null })}>
                {t('useCurrent')}
              </Button>
              <Button
                variant={hasDefault ? 'secondary' : 'outline'}
                size="sm"
                disabled={seasonId === null || league === null}
                onClick={() => update({ defaultSeason: seasonId, defaultLeague: league })}
              >
                {season?.label ?? '–'} · {league ?? '–'}
              </Button>
            </div>
          </Row>
          <Row label={t('clearData')}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clearAllStored()
                update(DEFAULT_PREFS)
                toast(t('clearDataDone'))
              }}
            >
              {t('clearData')}
            </Button>
          </Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('diagnostics')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Diagnostics />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('dataSource')}</CardTitle>
          <CardDescription>{t('dataSourceNote')}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href={SOURCE_SITE} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-2">
            {SOURCE_SITE.replace('https://', '')}
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
