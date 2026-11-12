import { useT } from '@/hooks/prefs'
import type { MessageKey } from '@/i18n/dict'
import type { Outcome } from '@/lib/stats'
import { cn } from '@/lib/utils'

const STYLE: Record<Outcome, { label: MessageKey; hu: string; en: string; className: string }> = {
  W: { label: 'win', hu: 'Gy', en: 'W', className: 'bg-win text-white dark:text-black' },
  D: { label: 'draw', hu: 'D', en: 'D', className: 'bg-draw text-white dark:text-black' },
  L: { label: 'loss', hu: 'V', en: 'L', className: 'bg-loss text-white dark:text-black' },
}

/** W/D/L chips with a letter, so the strip never relies on colour alone. */
export function FormStrip({ form, locale }: { form: readonly Outcome[]; locale: 'hu' | 'en' }) {
  const t = useT()
  if (form.length === 0) return <span className="text-xs text-muted-foreground">{t('noData')}</span>
  return (
    <ol className="flex gap-0.5" aria-label={`${t('form')}: ${form.map((o) => t(STYLE[o].label)).join(', ')}`}>
      {form.map((o, i) => (
        <li
          key={i}
          aria-hidden
          className={cn('grid size-5 place-items-center rounded-sm text-[10px] font-bold', STYLE[o].className)}
        >
          {STYLE[o][locale]}
        </li>
      ))}
    </ol>
  )
}
