import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { BarChart3, CalendarDays, ListOrdered, Menu, Moon, Settings, Sun, SunMoon, Target, Trophy } from 'lucide-react'
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

/** `seasonOnly`: the link keeps the season but not the league (the schedule opens on every league). */
type NavItem = { to: string; label: MessageKey; icon: LucideIcon; seasonOnly?: boolean }

const PRIMARY: NavItem[] = [
  { to: '/', label: 'navStandings', icon: ListOrdered },
  { to: '/menetrend', label: 'navSchedule', icon: CalendarDays, seasonOnly: true },
  { to: '/golok', label: 'navScorers', icon: Target },
]
const MORE: NavItem[] = [
  { to: '/statisztika', label: 'navStats', icon: BarChart3 },
  { to: '/orokranglista', label: 'navLeaderboard', icon: Trophy },
]
const SETTINGS: NavItem = { to: '/beallitasok', label: 'navSettings', icon: Settings }
const SECONDARY: NavItem[] = [...MORE, SETTINGS]

const THEME_ICON: Record<Prefs['theme'], LucideIcon> = { system: SunMoon, light: Sun, dark: Moon }

// The bars are dark in both themes, so their links use fixed light-on-dark colours.
const ON_DARK = 'text-white/70 hover:bg-white/10 hover:text-white'
const ON_DARK_ACTIVE = 'bg-white text-neutral-950 hover:bg-white hover:text-neutral-950'

function NavItems({
  items,
  keep,
  keepSeason,
  className,
  activeClassName = 'bg-accent text-accent-foreground',
  onNavigate,
}: {
  items: NavItem[]
  keep: string
  keepSeason: string
  className?: string
  activeClassName?: string
  onNavigate?: () => void
}) {
  const t = useT()
  return items.map(({ to, label, icon: Icon, seasonOnly }) => (
    <NavLink
      key={to}
      to={`${to}${seasonOnly ? keepSeason : keep}`}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn('flex items-center gap-1.5 px-2 py-1.5 font-heading text-[13px] font-semibold transition-colors hover:bg-accent', className, isActive && activeClassName)
      }
    >
      <Icon className="size-4" aria-hidden />
      <span>{t(label)}</span>
    </NavLink>
  ))
}

function HeaderControls({ keep }: { keep: string }) {
  const t = useT()
  const { prefs, update } = usePrefs()
  const ThemeIcon = THEME_ICON[prefs.theme]
  return (
    <div className="flex items-center gap-1">
      <NavLink
        to={`${SETTINGS.to}${keep}`}
        aria-label={t(SETTINGS.label)}
        title={t(SETTINGS.label)}
        className={({ isActive }) => cn('hidden size-8 items-center justify-center lg:flex', isActive ? ON_DARK_ACTIVE : ON_DARK)}
      >
        <Settings className="size-4" aria-hidden />
      </NavLink>
      <Button variant="ghost" size="sm" className={ON_DARK} onClick={() => update({ locale: prefs.locale === 'hu' ? 'en' : 'hu' })} lang={prefs.locale === 'hu' ? 'en' : 'hu'}>
        {prefs.locale === 'hu' ? 'EN' : 'HU'}
        <span className="sr-only">{t('toggleLanguage')}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={ON_DARK} aria-label={t('toggleTheme')}>
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
  const { keep, keepSeason, seasonId, league } = useSelection()
  const [moreOpen, setMoreOpen] = useState(false)
  const sourceUrl = seasonId !== null && league ? `${SOURCE_SITE}/tabella?selected_season=${seasonId}&league=${league}` : `${SOURCE_SITE}/tabella`

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-2">
        {t('skipToContent')}
      </a>
      <header className="sticky top-0 z-30 bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5">
          <NavLink to={`/${keep}`} className="flex shrink-0 items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-7" />
            <span className="font-heading text-xl font-bold whitespace-nowrap">{t('appName')}</span>
          </NavLink>
          <nav aria-label={t('menu')} className="hidden items-center gap-0.5 lg:flex [&_svg]:hidden 2xl:[&_svg]:block">
            <NavItems items={[...PRIMARY, ...MORE]} keep={keep} keepSeason={keepSeason} className={ON_DARK} activeClassName={ON_DARK_ACTIVE} />
          </nav>
          <HeaderControls keep={keep} />
        </div>
      </header>
      <DataStatus />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-3 pt-6 pb-28 lg:pb-10">
        <Suspense fallback={<ListSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="bg-cream px-3 pt-8 pb-28 text-xs text-muted-foreground lg:pb-8">
        <div className="mx-auto max-w-5xl space-y-1">
          <p lang="hu">{t('disclaimer')}</p>
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {t('officialPage')}: {sourceUrl.replace('https://', '')}
          </a>
        </div>
      </footer>

      <nav
        aria-label={t('menu')}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 gap-1 bg-neutral-950/90 p-1 text-white shadow-lg backdrop-blur lg:hidden"
      >
        <NavItems items={PRIMARY} keep={keep} keepSeason={keepSeason} className={cn(ON_DARK, 'flex-col gap-0.5 py-2 text-[10px]')} activeClassName={ON_DARK_ACTIVE} />
        <button type="button" onClick={() => setMoreOpen(true)} className={cn(ON_DARK, 'flex flex-col items-center gap-0.5 py-2 font-heading text-[10px] font-semibold')}>
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
            <NavItems items={SECONDARY} keep={keep} keepSeason={keepSeason} onNavigate={() => setMoreOpen(false)} className="py-3 text-base" />
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
