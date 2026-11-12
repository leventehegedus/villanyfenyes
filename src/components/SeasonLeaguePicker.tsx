import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useT } from '@/hooks/prefs'
import { useSelection } from '@/hooks/useSelection'

export function SeasonLeaguePicker() {
  const t = useT()
  const { seasons, seasonId, league, leagues, setSelection } = useSelection()
  const withData = seasons.data?.leagues ?? {}
  const options = (seasons.data?.seasons ?? []).filter((s) => withData[String(s.id)]?.length)

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={seasonId === null ? '' : String(seasonId)} onValueChange={(v) => setSelection({ s: Number(v) })}>
        <SelectTrigger aria-label={t('season')} className="min-w-40">
          <SelectValue placeholder={t('season')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.label}
              {s.id === seasons.data?.currentSeasonId ? ` (${t('current')})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={league ?? ''} onValueChange={(v) => setSelection({ l: v })}>
        <SelectTrigger aria-label={t('league')} className="min-w-24">
          <SelectValue placeholder={t('league')} />
        </SelectTrigger>
        <SelectContent>
          {leagues.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
