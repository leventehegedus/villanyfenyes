import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useT } from '@/hooks/prefs'
import type { Team } from '@/lib/schema'

const ALL = '__all'

/** Team picker with an "all teams" option; null means all. */
export function TeamSelect({ teams, value, onChange }: { teams: readonly Team[]; value: string | null; onChange: (id: string | null) => void }) {
  const t = useT()
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
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
  )
}
