import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import { MatchesView } from '@/components/MatchesView'
import { Button } from '@/components/ui/button'
import { useT } from '@/hooks/prefs'
import type { LeagueData } from '@/lib/data'
import { buildIcs } from '@/lib/ics'
import type { Match } from '@/lib/schema'

function CalendarButton({ matches, data }: { matches: Match[]; data: LeagueData }) {
  const t = useT()
  const download = () => {
    const timed = matches.filter((m) => m.kickoff !== null)
    if (timed.length === 0) {
      toast(t('calendarNone'))
      return
    }
    const names = new Map(data.teams.map((team) => [team.id, team.name]))
    const blob = new Blob([buildIcs(timed, names, data.league, new Date())], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `villanyfenyes-${data.league}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <Button variant="outline" size="sm" onClick={download}>
      <CalendarPlus aria-hidden />
      {t('addToCalendar')}
    </Button>
  )
}

export default function SchedulePage() {
  return (
    <MatchesView
      title="navSchedule"
      defaultStatus="upcoming"
      showStatus
      newestFirst={false}
      actions={(matches, data) => <CalendarButton matches={matches} data={data} />}
    />
  )
}
