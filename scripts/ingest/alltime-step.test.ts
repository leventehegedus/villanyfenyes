import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leagueFixture } from '../../src/lib/__fixtures__/league'
import type { LeagueFile, SeasonsFile } from '../../src/lib/schema'
import { teamFiles } from './alltime-step'

const seasons: SeasonsFile = {
  schemaVersion: 1,
  currentSeasonId: 55,
  seasons: [
    { id: 55, label: '2026 - Ősz', year: 2026, half: 'osz', start: '2026-08-31', end: '2026-12-18' },
    { id: 54, label: '2026 - Nyár', year: 2026, half: 'nyar', start: '2026-06-08', end: '2026-08-28' },
  ],
  leagues: { '54': ['L1'], '55': ['L1'] },
}

const older: LeagueFile = { ...leagueFixture, seasonId: 54, matches: [], standings: [] }

function dataDir(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'alltime-'))
  for (const [rel, value] of Object.entries(files)) {
    mkdirSync(join(dir, rel, '..'), { recursive: true })
    writeFileSync(join(dir, rel), JSON.stringify(value))
  }
  return dir
}

describe('teamFiles', () => {
  it('builds one file per team from the files on disk', () => {
    const out = dataDir({ 'seasons.json': seasons, '55/L1.json': leagueFixture, '54/L1.json': older })
    const { files, errors } = teamFiles(out, new Map())
    expect(errors).toEqual([])
    expect([...files.keys()].sort()).toEqual(['teams/1.json', 'teams/2.json', 'teams/3.json', 'teams/4.json'])
    expect(files.get('teams/1.json')?.seasons.map((s) => s.seasonId)).toEqual([55, 54])
  })

  it('prefers the files this run produced over the disk copies', () => {
    const out = dataDir({ 'seasons.json': seasons, '55/L1.json': older })
    const { files } = teamFiles(out, new Map<string, unknown>([['55/L1.json', leagueFixture]]))
    expect(files.get('teams/1.json')?.seasons[0]?.totals.played).toBe(3)
  })

  it('fails without writing when a league file is invalid', () => {
    const out = dataDir({ 'seasons.json': seasons, '55/L1.json': { ...leagueFixture, teams: 'broken' } })
    const { files, errors } = teamFiles(out, new Map())
    expect(files.size).toBe(0)
    expect(errors).toEqual(['55/L1.json: invalid league file'])
  })

  it('warns when one name has several team ids', () => {
    const renamed: LeagueFile = { ...older, teams: [{ id: '9', siteId: 9, name: 'Árvíztűrő FC' }] }
    const out = dataDir({ 'seasons.json': seasons, '55/L1.json': leagueFixture, '54/L1.json': renamed })
    expect(teamFiles(out, new Map()).warnings).toEqual(['team name "Árvíztűrő FC" has several ids: 9, 1'])
  })
})
