import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavourites, useT } from '@/hooks/prefs'
import { cn } from '@/lib/utils'

export function FavouriteButton({ teamId, name, className }: { teamId: string; name: string; className?: string }) {
  const t = useT()
  const { isFavourite, toggle } = useFavourites()
  const on = isFavourite(teamId)
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-7 shrink-0', className)}
      aria-pressed={on}
      aria-label={t(on ? 'removeFavourite' : 'addFavourite', { name })}
      onClick={() => toggle(teamId)}
    >
      <Star className={cn('size-4', on ? 'fill-primary text-primary' : 'text-muted-foreground')} aria-hidden />
    </Button>
  )
}
