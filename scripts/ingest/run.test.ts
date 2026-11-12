import { describe, expect, it } from 'vitest'
import { LeagueFile, SeasonsFile } from '../../src/lib/schema'
import { fixtureSource } from './fixture-source'
import { runIngest } from './run'
import type { Source } from './run'

const opts = {
  leagues: ['L1'],
  now: new Date('2026-11-12T12:00:00Z'),
  includeHallOfFame: true,
  previousLeague: () => null,
  previousSeasons: null,
}

describe('runIngest on fixtures (dry run)', () => {
  it('builds valid files and reports unavailable match pages as warnings', async () => {
    const res = await runIngest(fixtureSource, opts)
    expect(res.errors).toEqual([])
    expect([...res.files.keys()].sort()).toEqual(['55/L1.json', 'hall-of-fame.json', 'seasons.json'])
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
