import { describe, expect, it } from 'vitest'
import { LeagueFile, SeasonsFile } from '../../src/lib/schema'
import { BudgetExceeded } from './fetch'
import { fixtureSource } from './fixture-source'
import { runIngest } from './run'
import type { Source } from './run'

const opts = {
  leagues: ['L1'],
  now: new Date('2026-11-12T12:00:00Z'),
  previousLeague: () => null,
  previousSeasons: null,
}

describe('runIngest on fixtures (dry run)', () => {
  it('builds valid files and reports unavailable match pages as warnings', async () => {
    const res = await runIngest(fixtureSource, opts)
    expect(res.errors).toEqual([])
    expect([...res.files.keys()].sort()).toEqual(['55/L1.json', 'seasons.json'])
    const league = LeagueFile.parse(res.files.get('55/L1.json'))
    expect(league.matches.find((m) => m.id === '48343')?.status).toBe('played')
    expect(SeasonsFile.parse(res.files.get('seasons.json')).leagues).toEqual({ '55': ['L1'] })
    expect(res.report.warnings.some((w) => w.includes('HTTP 404'))).toBe(true)
  })

  it('fails without files worth writing when the site serves a different page', async () => {
    const broken: Source = { get: async () => '<html><body>Karbantartás</body></html>' }
    const res = await runIngest(broken, opts)
    expect(res.errors).toEqual(['entry page: no season selector'])
  })

  it('fails the gate when the table shrinks drastically', async () => {
    const first = LeagueFile.parse((await runIngest(fixtureSource, opts)).files.get('55/L1.json'))
    const bigger = { ...first, teams: [...first.teams, ...first.teams, ...first.teams] }
    const res = await runIngest(fixtureSource, { ...opts, previousLeague: () => bigger })
    expect(res.errors[0]).toMatch(/teams dropped/)
  })
})

describe('runIngest request budget', () => {
  it('stops fetching match pages when the budget runs out and reports them as pending', async () => {
    let calls = 0
    const limited: Source = {
      get: async (path) => {
        calls += 1
        if (calls > 3) throw new BudgetExceeded(3)
        return fixtureSource.get(path)
      },
    }
    const res = await runIngest(limited, opts)
    expect(res.errors).toEqual([])
    expect(res.report.pendingMatchDetails).toBeGreaterThan(0)
    expect(res.files.has('55/L1.json')).toBe(true)
  })
})

describe('runIngest resilience', () => {
  it('keeps only enabled leagues of earlier runs in seasons.json', async () => {
    const previousSeasons = { schemaVersion: 1, currentSeasonId: 55, seasons: [], leagues: { '55': ['L2A'] } }
    const res = await runIngest(fixtureSource, { ...opts, previousSeasons })
    expect(SeasonsFile.parse(res.files.get('seasons.json')).leagues['55']).toEqual(['L1'])
  })

  it('fails when a league that had teams comes back empty', async () => {
    const first = LeagueFile.parse((await runIngest(fixtureSource, opts)).files.get('55/L1.json'))
    const empty: Source = { get: async (path) => (await fixtureSource.get(path)).replace(/<div class="tabella-row"/g, '<div class="x"') }
    const res = await runIngest(empty, { ...opts, previousLeague: () => first })
    expect(res.errors[0]).toMatch(/empty table/)
  })
})

describe('runIngest league allowlist', () => {
  it('fetches only enabled leagues even when the site lists more', async () => {
    const asked: string[] = []
    const spy: Source = { get: (path) => (asked.push(path), fixtureSource.get(path)) }
    const res = await runIngest(spy, { ...opts, leagues: undefined, previousSeasons: { schemaVersion: 1, currentSeasonId: 55, seasons: [], leagues: { '55': ['L1', 'L2A'] } } })
    expect(res.errors).toEqual([])
    expect(asked.some((p) => /league=(?!L1)/.test(p))).toBe(false)
    expect(SeasonsFile.parse(res.files.get('seasons.json')).leagues['55']).toEqual(['L1'])
  })

  it('refuses a league that is not enabled', async () => {
    const res = await runIngest(fixtureSource, { ...opts, leagues: ['L2A'] })
    expect(res.errors).toEqual(['league L2A is not enabled (see src/lib/leagues.ts)'])
  })
})
