import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/prefs'

type Props<T> = {
  query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError' | 'refetch' | 'isFetching'>
  /** Shown when the query is disabled because nothing is selected yet. */
  idle?: boolean
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}

export function ErrorState({ onRetry, busy }: { onRetry: () => void; busy?: boolean }) {
  const t = useT()
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <AlertTriangle className="size-6 text-loss" aria-hidden />
      <p className="font-medium">{t('errorTitle')}</p>
      <p className="text-sm text-muted-foreground">{t('errorBody')}</p>
      <Button variant="outline" onClick={onRetry} disabled={busy}>
        <RotateCw className={busy ? 'animate-spin' : ''} aria-hidden />
        {t('retry')}
      </Button>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</p>
}

export const ListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="space-y-2" aria-hidden>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
)

/** Loading skeleton, error with retry, and stale data kept visible when a refetch fails. */
export function QueryBoundary<T>({ query, idle, skeleton, children }: Props<T>) {
  const t = useT()
  const retry = () => void query.refetch()
  if (idle) return <EmptyState>{t('emptySeason')}</EmptyState>
  if (query.data !== undefined) {
    return (
      <>
        {query.isError && (
          <p role="status" className="mb-3 flex items-center gap-2 text-sm text-loss">
            <AlertTriangle className="size-4" aria-hidden /> {t('errorTitle')}
            <Button size="sm" variant="ghost" onClick={retry}>
              {t('retry')}
            </Button>
          </p>
        )}
        {children(query.data)}
      </>
    )
  }
  if (query.isError) return <ErrorState onRetry={retry} busy={query.isFetching} />
  return <>{skeleton ?? <ListSkeleton />}</>
}
