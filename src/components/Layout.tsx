import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { BarChart3, CalendarDays, ListOrdered, Menu, Moon, Settings, Sun, SunMoon, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DataStatus } from '@/components/DataStatus'
import { ListSkeleton } from '@/components/QueryBoundary'
import { usePrefs, useT } from '@/hooks/prefs'
import type { Prefs } from '@/hooks/prefs'
import { useSelection } from '@/hooks/useSelection'
import type { MessageKey } from '@/i18n/dict'
import { SOURCE_SITE } from '@/lib/config'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: MessageKey; icon: LucideIcon }

const PRIMARY: NavItem[] = [
  { to: '/', label: 'navStandings', icon: ListOrdered },
  { to: '/menetrend', label: 'navSchedule', icon: CalendarDays },
  { to: '/golok', label: 'navScorers', icon: Target },
]
const SECONDARY: NavItem[] = [
  { to: '/statisztika', label: 'navStats', icon: BarChart3 },
  { to: '/beallitasok', label: 'navSettings', icon: Settings },
]

const THEME_ICON: Record<Prefs['theme'], LucideIcon> = { system: SunMoon, light: Sun, dark: Moon }

function NavItems({ items, keep, className, onNavigate }: { items: NavItem[]; keep: string; className?: string; onNavigate?: () => void }) {
  const t = useT()
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={`${to}${keep}`}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent', isActive && 'bg-accent font-semibold', className)
      }
    >
      <Icon className="size-4" aria-hidden />
      <span>{t(label)}</span>
    </NavLink>
  ))
}

function HeaderControls() {
  const t = useT()
  const { prefs, update } = usePrefs()
  const ThemeIcon = THEME_ICON[prefs.theme]
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => update({ locale: prefs.locale === 'hu' ? 'en' : 'hu' })} lang={prefs.locale === 'hu' ? 'en' : 'hu'}>
        {prefs.locale === 'hu' ? 'EN' : 'HU'}
        <span className="sr-only">{t('toggleLanguage')}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('toggleTheme')}>
            <ThemeIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={prefs.theme} onValueChange={(v) => update({ theme: v === 'light' || v === 'dark' ? v : 'system' })}>
            <DropdownMenuRadioItem value="system">{t('themeSystem')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">{t('themeLight')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">{t('themeDark')}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Layout() {
  const t = useT()
  const { keep, seasonId, league } = useSelection()
  const [moreOpen, setMoreOpen] = useState(false)
  const sourceUrl = seasonId !== null && league ? `${SOURCE_SITE}/tabella?selected_season=${seasonId}&league=${league}` : `${SOURCE_SITE}/tabella`

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2">
        {t('skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-[radial-gradient(ellipse_at_top,var(--glow),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2">
          <NavLink to={`/${keep}`} className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-bold tracking-tight">
              <span className="text-primary">●</span> {t('appName')}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{t('appTagline')}</span>
          </NavLink>
          <nav aria-label={t('menu')} className="hidden items-center gap-0.5 md:flex">
            <NavItems items={[...PRIMARY, ...SECONDARY]} keep={keep} />
          </nav>
          <HeaderControls />
        </div>
      </header>
      <DataStatus />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-3 pt-4 pb-24 md:pb-8">
        <Suspense fallback={<ListSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t px-3 pt-4 pb-24 text-xs text-muted-foreground md:pb-6">
        <div className="mx-auto max-w-5xl space-y-1">
          <p lang="hu">{t('disclaimer')}</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {t('officialPage')}: {sourceUrl.replace('https://', '')}
          </a>
        </div>
      </footer>

      <nav aria-label={t('menu')} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <NavItems items={PRIMARY} keep={keep} className="flex-col gap-0.5 rounded-none py-2 text-[11px]" />
        <button type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] hover:bg-accent">
          <Menu className="size-4" aria-hidden />
          {t('menu')}
        </button>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent closeLabel={t('close')} side="bottom">
          <SheetHeader>
            <SheetTitle>{t('menu')}</SheetTitle>
            <SheetDescription className="sr-only">{t('appTagline')}</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-1 px-4 pb-6">
            <NavItems items={SECONDARY} keep={keep} onNavigate={() => setMoreOpen(false)} className="py-3 text-base" />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
