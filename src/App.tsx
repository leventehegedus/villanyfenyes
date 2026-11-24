import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { PrefsProvider } from '@/components/PrefsProvider'
import { Toaster } from '@/components/ui/sonner'
import { DataError } from '@/lib/data'
import { TooltipProvider } from '@/components/ui/tooltip'

const StandingsPage = lazy(() => import('@/pages/StandingsPage'))
const SchedulePage = lazy(() => import('@/pages/SchedulePage'))
const MatchDialog = lazy(() => import('@/pages/MatchDialog'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const TeamAllTimePage = lazy(() => import('@/pages/TeamAllTimePage'))
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'))
const PlayerPage = lazy(() => import('@/pages/PlayerPage'))
const ScorersPage = lazy(() => import('@/pages/ScorersPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      // A missing file will not appear by retrying; only the next ingest adds it.
      retry: (count, error) => !(error instanceof DataError && error.missing) && count < 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        <TooltipProvider disableHoverableContent>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<StandingsPage />} />
                <Route path="menetrend" element={<SchedulePage />} />
                <Route
                  path="m/:matchId"
                  element={
                    <>
                      <SchedulePage />
                      <MatchDialog />
                    </>
                  }
                />
                <Route path="t/:teamId/osszes" element={<TeamAllTimePage />} />
                <Route path="t/:teamId" element={<TeamPage />} />
                <Route path="j/:teamId/:name" element={<PlayerPage />} />
                <Route path="golok" element={<ScorersPage />} />
                <Route path="statisztika" element={<StatsPage />} />
                <Route path="orokranglista" element={<LeaderboardPage />} />
                <Route path="beallitasok" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </PrefsProvider>
    </QueryClientProvider>
  )
}
