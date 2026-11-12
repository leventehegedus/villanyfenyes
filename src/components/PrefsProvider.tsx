import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PrefsContext, applyTheme, loadPrefs, subscribeSystemTheme } from '@/hooks/prefs'
import type { Prefs } from '@/hooks/prefs'
import { writeStored } from '@/lib/storage'

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(loadPrefs)

  const update = useCallback(
    (patch: Partial<Prefs>) => {
      const next = { ...prefs, ...patch }
      setPrefs(next)
      writeStored('prefs', next)
      applyTheme(next.theme)
      document.documentElement.lang = next.locale
    },
    [prefs],
  )

  // Follow OS theme changes while "system" is selected (subscription, not data fetching).
  useEffect(() => {
    if (prefs.theme !== 'system') return
    return subscribeSystemTheme(() => applyTheme('system'))
  }, [prefs.theme])

  const value = useMemo(() => ({ prefs, update }), [prefs, update])
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}
