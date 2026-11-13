import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useT } from '@/hooks/prefs'
import type { Team } from '@/lib/schema'

type Props = { teams: readonly Team[]; value: readonly string[]; onChange: (ids: string[]) => void }

/** Pick any number of teams; an empty selection means all teams. */
export function TeamMultiSelect({ teams, value, onChange }: Props) {
  const t = useT()
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'hu'))
  const label =
    value.length === 0
      ? t('allTeams')
      : value.length === 1
        ? (teams.find((x) => x.id === value[0])?.name ?? t('allTeams'))
        : t('teamsSelected', { count: value.length })
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((x) => x !== id))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-44 justify-between font-normal" aria-label={`${t('team')}: ${label}`}>
          <span className="truncate">{label}</span>
          <ChevronDown className="opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuItem disabled={value.length === 0} onSelect={() => onChange([])}>
          {t('allTeams')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {sorted.map((team) => (
          <DropdownMenuCheckboxItem
            key={team.id}
            checked={value.includes(team.id)}
            onCheckedChange={(on) => toggle(team.id, on === true)}
            onSelect={(e) => e.preventDefault()}
          >
            {team.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
