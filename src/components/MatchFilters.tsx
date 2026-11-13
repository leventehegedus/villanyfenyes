import { TeamMultiSelect } from '@/components/TeamMultiSelect'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useT } from '@/hooks/prefs'
import type { Team } from '@/lib/schema'
import type { MatchFilterState } from '@/lib/url-state'

type Props = {
  teams: readonly Team[]
  value: MatchFilterState
  onChange: (extra: Record<string, string | null>) => void
}

export function MatchFilters({ teams, value, onChange }: Props) {
  const t = useT()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TeamMultiSelect teams={teams} value={value.teamIds} onChange={(ids) => onChange({ t: ids.join(',') || null })} />
      <ToggleGroup type="single" variant="outline" value={value.status} onValueChange={(v) => v && onChange({ st: v })} aria-label={t('statusAll')}>
        <ToggleGroupItem value="upcoming">{t('statusUpcoming')}</ToggleGroupItem>
        <ToggleGroupItem value="past">{t('statusPlayed')}</ToggleGroupItem>
        <ToggleGroupItem value="all">{t('statusAll')}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
