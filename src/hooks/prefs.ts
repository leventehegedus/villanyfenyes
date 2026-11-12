import { createContext, useCallback, useContext } from 'react'
import { z } from 'zod'
import { translate } from '@/i18n/dict'
import type { MessageKey } from '@/i18n/dict'
import { readStored } from '@/lib/storage'
import { SITE_TIME_ZONE } from '@/lib/time'

export const Prefs = z.object({
  locale: z.enum(['hu', 'en']).catch('hu'),
  theme: z.enum(['system', 'light', 'dark']).catch('system'),
  timeZone: z.string().catch(SITE_TIME_ZONE),
  defaultSeason: z.number().int().nullable().catch(null),
  defaultLeague: z.string().nullable().catch(null),
  favourites: z.array(z.string()).catch([]),
})
export type Prefs = z.infer<typeof Prefs>

export const DEFAULT_PREFS: Prefs = {
  locale: 'hu',
  theme: 'system',
  timeZone: SITE_TIME_ZONE,
  defaultSeason: null,
  defaultLeague: null,
  favourites: [],
}

export const loadPrefs = () => readStored('prefs', Prefs, DEFAULT_PREFS)

export type PrefsContextValue = { prefs: Prefs; update: (patch: Partial<Prefs>) => void }

export const PrefsContext = createContext<PrefsContextValue>({ prefs: DEFAULT_PREFS, update: () => {} })

export const usePrefs = () => useContext(PrefsContext)

export function useT() {
  const { locale } = usePrefs().prefs
  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )
}

export function useFavourites() {
  const { prefs, update } = usePrefs()
  const favourites = prefs.favourites
  const toggle = useCallback(
    (teamId: string) =>
      update({
        favourites: favourites.includes(teamId) ? favourites.filter((id) => id !== teamId) : [...favourites, teamId],
      }),
    [favourites, update],
  )
  return { favourites, isFavourite: (id: string) => favourites.includes(id), toggle }
}

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)')

/** Sets the `dark` class on <html> for the chosen theme. */
export function applyTheme(theme: Prefs['theme']): void {
  const dark = theme === 'dark' || (theme === 'system' && Boolean(darkQuery()?.matches))
  document.documentElement.classList.toggle('dark', dark)
}

export function subscribeSystemTheme(onChange: () => void): () => void {
  const mq = darkQuery()
  mq?.addEventListener('change', onChange)
  return () => mq?.removeEventListener('change', onChange)
}
