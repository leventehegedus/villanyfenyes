import { Star } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFavourites, useT } from '@/hooks/prefs'
import type { Team } from '@/lib/schema'
import type { MatchFilterState } from '@/lib/url-state'

const ALL = '__all'

type Props = {
  teams: readonly Team[]
  value: MatchFilterState
  showStatus: boolean
  onChange: (extra: Record<string, string | null>) => void
}

export function MatchFilters({ teams, value, showStatus, onChange }: Props) {
  const t = useT()
  const { favourites } = useFavourites()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.teamId ?? ALL} onValueChange={(v) => onChange({ t: v === ALL ? null : v })}>
        <SelectTrigger aria-label={t('team')} className="min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('allTeams')}</SelectItem>
          {[...teams]
            .sort((a, b) => a.name.localeCompare(b.name, 'hu'))
            .map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {showStatus && (
        <ToggleGroup
          type="single"
          variant="outline"
          value={value.status}
          onValueChange={(v) => v && onChange({ st: v })}
          aria-label={t('statusAll')}
        >
          <ToggleGroupItem value="upcoming">{t('statusUpcoming')}</ToggleGroupItem>
          <ToggleGroupItem value="played">{t('statusPlayed')}</ToggleGroupItem>
          <ToggleGroupItem value="all">{t('statusAll')}</ToggleGroupItem>
        </ToggleGroup>
      )}
      <Toggle
        variant="outline"
        pressed={value.favOnly}
        onPressedChange={(on) => onChange({ fav: on ? '1' : null })}
        disabled={favourites.length === 0}
      >
        <Star className={value.favOnly ? 'fill-primary text-primary' : ''} aria-hidden />
        {t('favouritesOnly')}
      </Toggle>
    </div>
  )
}
