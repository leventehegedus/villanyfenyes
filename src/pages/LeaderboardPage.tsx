import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, QueryBoundary } from '@/components/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/hooks/prefs'
import { useLeaderboard } from '@/hooks/queries'
import type { MessageKey } from '@/i18n/dict'
import { rankBy } from '@/lib/alltime'
import type { LeaderboardKey } from '@/lib/alltime'
import { DataError } from '@/lib/data'
import type { LeaderboardRow } from '@/lib/schema'

const TOP = 10

const BOARDS: { key: LeaderboardKey; title: MessageKey; note: MessageKey }[] = [
  { key: 'titles', title: 'lbTitles', note: 'lbTitlesNote' },
  { key: 'l1Seasons', title: 'lbSeasons', note: 'lbSeasonsNote' },
  { key: 'won', title: 'lbWins', note: 'computedNote' },
  { key: 'goalsFor', title: 'lbGoals', note: 'computedNote' },
]

/** One ranking: top ten, the rest behind a toggle; teams link to their all-time page. */
function Board({ rows, board }: { rows: readonly LeaderboardRow[]; board: (typeof BOARDS)[number] }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ranked = rankBy(rows, board.key)
  const shown = open ? ranked : ranked.slice(0, TOP)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t(board.title)}</h2>
        </CardTitle>
        <CardDescription>{t(board.note)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {shown.map((r) => (
              <li key={r.teamId} className="flex items-baseline gap-2">
                <span className="tabular w-6 shrink-0 text-right text-muted-foreground">{r.rank}.</span>
                <Link to={`/t/${encodeURIComponent(r.teamId)}/osszes`} className="min-w-0 flex-1 truncate hover:underline">
                  {r.name}
                </Link>
                <span className="tabular font-semibold">{r.value}</span>
              </li>
            ))}
          </ol>
        )}
        {ranked.length > TOP && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {t(open ? 'showLess' : 'showAll')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function LeaderboardPage() {
  const t = useT()
  const query = useLeaderboard()
  const missing = query.error instanceof DataError && query.error.missing
  return (
    <div className="space-y-4">
      <PageHeader title={t('leaderboardTitle')} picker={false}>
        <p className="text-sm text-muted-foreground">{t('leaderboardNote')}</p>
      </PageHeader>
      {missing ? (
        <EmptyState>{t('noData')}</EmptyState>
      ) : (
        <QueryBoundary query={query}>
          {(data) => (
            <div className="grid gap-4 md:grid-cols-2">
              {BOARDS.map((b) => (
                <Board key={b.key} rows={data.rows} board={b} />
              ))}
            </div>
          )}
        </QueryBoundary>
      )}
    </div>
  )
}
