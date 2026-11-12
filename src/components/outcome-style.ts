import type { MessageKey } from '@/i18n/dict'
import type { Outcome } from '@/lib/stats'

/** Label, letter and colour per result; the letter keeps meaning without colour. */
export const OUTCOME_STYLE: Record<Outcome, { label: MessageKey; hu: string; en: string; className: string }> = {
  W: { label: 'win', hu: 'Gy', en: 'W', className: 'bg-win text-white dark:text-black' },
  D: { label: 'draw', hu: 'D', en: 'D', className: 'bg-draw text-white dark:text-black' },
  L: { label: 'loss', hu: 'V', en: 'L', className: 'bg-loss text-white dark:text-black' },
}
