import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePrefs, useT } from '@/hooks/prefs'
import { useMeta } from '@/hooks/queries'
import { STALE_AFTER_HOURS } from '@/lib/config'
import { formatAge, formatKickoff, isStale } from '@/lib/format'

/** Data age from meta.generatedAt, a stale banner and a manual refresh. */
export function DataStatus() {
  const t = useT()
  const { prefs } = usePrefs()
  const meta = useMeta()
  const client = useQueryClient()
  const now = new Date()
  const generatedAt = meta.data?.generatedAt
  const stale = generatedAt ? isStale(generatedAt, now, STALE_AFTER_HOURS) : false

  return (
    <div className="border-b bg-muted/40 text-xs">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-1">
        <span className="text-muted-foreground" title={formatKickoff(generatedAt ?? null, prefs.locale, prefs.timeZone) ?? undefined}>
          {generatedAt ? t('dataAge', { age: formatAge(generatedAt, now, prefs.locale) }) : meta.isError ? t('errorTitle') : t('loading')}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => void client.invalidateQueries()}
          disabled={meta.isFetching}
        >
          <RotateCw className={meta.isFetching ? 'size-3 animate-spin' : 'size-3'} aria-hidden />
          {t('refresh')}
        </Button>
      </div>
      {stale && (
        <p role="status" className="flex items-center justify-center gap-2 bg-accent px-3 py-1.5 text-center text-accent-foreground">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {t('staleBanner', { hours: STALE_AFTER_HOURS })}
        </p>
      )}
    </div>
  )
}
