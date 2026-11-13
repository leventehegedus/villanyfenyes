import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrefs, useT } from '@/hooks/prefs'
import type { MessageKey } from '@/i18n/dict'
import type { TeamAllTimeData } from '@/lib/data'
import { formatDate } from '@/lib/format'
import type { MatchRef } from '@/lib/schema'

type Props = { file: TeamAllTimeData; teamName: (id: string) => string }

const matchPath = (m: MatchRef) => `/m/${encodeURIComponent(m.matchId)}?s=${m.seasonId}&l=${m.league}`

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular">{children}</dd>
    </>
  )
}

/** Record matches, longest streaks and clean-sheet counts, all computed from results. */
export function Records({ file, teamName }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const missing = t('noData')
  const date = (m: MatchRef) => (m.kickoff ? formatDate(m.kickoff, prefs.locale, prefs.timeZone) : missing)
  const match = (m: MatchRef | null) =>
    m ? (
      <Link to={matchPath(m)} className="hover:underline">
        {m.goalsFor}:{m.goalsAgainst} – {teamName(m.opponentId)} ({date(m)})
      </Link>
    ) : (
      missing
    )
  const records: [MessageKey, MatchRef | null][] = [
    ['biggestWin', file.records.biggestWin],
    ['biggestDefeat', file.records.biggestDefeat],
    ['highestScoring', file.records.highestScoring],
  ]
  const streaks: [MessageKey, TeamAllTimeData['streaks']['win']][] = [
    ['longestWinRun', file.streaks.win],
    ['longestUnbeatenRun', file.streaks.unbeaten],
    ['longestLossRun', file.streaks.loss],
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('records')}</h2>
        </CardTitle>
        <CardDescription>{t('computedNote')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          {records.map(([key, m]) => (
            <Row key={key} label={t(key)}>
              {match(m)}
            </Row>
          ))}
          {streaks.map(([key, s]) => (
            <Row key={key} label={t(key)}>
              {s ? `${s.length} · ${date(s.from)} – ${date(s.to)}` : missing}
            </Row>
          ))}
          <Row label={t('cleanSheets')}>{file.cleanSheets}</Row>
          <Row label={t('failedToScore')}>{file.failedToScore}</Row>
        </dl>
      </CardContent>
    </Card>
  )
}
