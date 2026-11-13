import { StandingsTable } from '@/components/StandingsTable'
import { Button } from '@/components/ui/button'
import { usePrefs, useT } from '@/hooks/prefs'
import { useSelection } from '@/hooks/useSelection'
import type { LeagueData } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { matchesUpToWeek, standingsAtWeek } from '@/lib/stats'
import { parseStandingsSort, writeStandingsSort } from '@/lib/url-state'

type Props = {
  data: LeagueData
  keep: string
  teamName: (id: string) => string
  /** Monday (YYYY-MM-DD) picked on a chart; null = the site's current table. */
  week: string | null
  highlight: readonly string[]
}

/** League table now, or as it stood at the end of the week picked on a chart (?w=YYYY-MM-DD). */
export function WeekTable({ data, keep, teamName, week, highlight }: Props) {
  const t = useT()
  const { prefs } = usePrefs()
  const { params, setSelection } = useSelection()
  const ids = data.teams.map((x) => x.id)
  return (
    <section aria-labelledby="week-table" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="week-table" className="text-sm font-semibold">
          {week ? t('tableAtWeek', { week: formatDate(week, prefs.locale, prefs.timeZone) }) : t('tableNow')}
        </h3>
        {week ? (
          <Button variant="outline" size="sm" onClick={() => setSelection({ extra: { w: null } })}>
            {t('backToCurrent')}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">{t('tableWeekHint')}</p>
        )}
      </div>
      <StandingsTable
        rows={week ? standingsAtWeek(ids, data.matches, week) : data.standings}
        matches={week ? matchesUpToWeek(data.matches, week) : data.matches}
        teamName={teamName}
        keep={keep}
        sort={parseStandingsSort(params.get('o'))}
        onSort={(o) => setSelection({ extra: { o: writeStandingsSort(o) } })}
        highlight={highlight}
      />
    </section>
  )
}
