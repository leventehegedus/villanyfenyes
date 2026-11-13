import { Suspense, lazy } from 'react'
import { Link, useParams } from 'react-router'
import { AllTimeHeader, Honours, LeagueTotals } from '@/components/alltime/Overview'
import { AllTimeScorers, Opponents } from '@/components/alltime/People'
import { Records } from '@/components/alltime/Records'
import { Timeline } from '@/components/alltime/Timeline'
import { EmptyState, ListSkeleton, QueryBoundary } from '@/components/QueryBoundary'
import { useT } from '@/hooks/prefs'
import { useTeamAllTime } from '@/hooks/queries'
import { useSelection } from '@/hooks/useSelection'
import { goalsPerSeason } from '@/lib/alltime'
import { DataError } from '@/lib/data'
import type { TeamAllTimeData } from '@/lib/data'

const GoalsChart = lazy(() => import('@/components/alltime/GoalsChart'))

function AllTimeView({ file }: { file: TeamAllTimeData }) {
  const names = new Map(file.opponents.map((o) => [o.teamId, o.name]))
  const teamName = (id: string) => names.get(id) ?? id
  return (
    <div className="space-y-5">
      <AllTimeHeader file={file} />
      <Honours file={file} />
      <LeagueTotals file={file} />
      <Timeline file={file} />
      {file.seasons.length > 1 && (
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <GoalsChart data={goalsPerSeason(file)} />
        </Suspense>
      )}
      <Records file={file} teamName={teamName} />
      <Opponents file={file} teamName={teamName} />
      <AllTimeScorers file={file} />
    </div>
  )
}

/** Team history across every ingested season and league; no season picker. */
export default function TeamAllTimePage() {
  const t = useT()
  const { teamId = '' } = useParams()
  const { keep } = useSelection()
  const query = useTeamAllTime(teamId)
  const missing = query.error instanceof DataError && query.error.missing
  return (
    <div className="space-y-4">
      <Link to={`/t/${encodeURIComponent(teamId)}${keep}`} className="text-sm font-medium text-primary hover:underline">
        ← {t('backToSeason')}
      </Link>
      {missing ? <EmptyState>{t('teamNoHistory')}</EmptyState> : <QueryBoundary query={query}>{(file) => <AllTimeView file={file} />}</QueryBoundary>}
    </div>
  )
}
