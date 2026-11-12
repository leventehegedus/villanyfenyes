import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LeagueFile } from '../../src/lib/schema'
import { buildLeagueFile, needsDetail, splitTeams } from './normalise'
import { parseMatchPage } from './parse-match'
import { parseStandingsPage } from './parse-standings'

const fixture = (name: string) => readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')
const page = parseStandingsPage(fixture('standings-current-L1.html'))
const detail = parseMatchPage(fixture('match-played.html'))
const now = new Date('2026-11-12T12:00:00Z')
const base = { seasonId: 55, league: 'L1', sourceUrl: 'https://villanyfenyesbajnoksag.hu/tabella?selected_season=55&league=L1', page, now }

describe('splitTeams', () => {
  const names = ['A - B', 'C', 'A']
  it('splits on the separator that leaves two known names', () => {
    expect(splitTeams('A - B - C', names)).toEqual(['A - B', 'C'])
    expect(splitTeams('C - A', names)).toEqual(['C', 'A'])
  })
  it('returns null when no split matches', () => {
    expect(splitTeams('X - Y', names)).toBeNull()
  })
})

describe('buildLeagueFile', () => {
  const { file, skipped } = buildLeagueFile({
    ...base,
    previous: null,
    details: new Map([[48343, { page: detail, fetchedAt: '2026-11-12T11:00:00.000Z' }]]),
  })

  it('produces a schema-valid file', () => {
    expect(LeagueFile.safeParse(file).success).toBe(true)
    expect(skipped).toEqual([])
  })

  it('uses site team ids from the result links', () => {
    expect(file.teams.find((t) => t.name === 'Lokomotív MFC')).toEqual({ id: '69', siteId: 69, name: 'Lokomotív MFC' })
    expect(file.standings[0]).toMatchObject({ position: 1, teamId: '69', points: 21 })
  })

  it('dedupes matches seen on both teams and keeps a round robin count', () => {
    const ids = file.matches.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(file.matches).toHaveLength(66) // 12 teams, single round robin, 11 cards each
  })

  it('merges the fetched match page with score and scorers', () => {
    const m = file.matches.find((x) => x.id === '48343')
    expect(m).toMatchObject({
      homeTeamId: '100',
      awayTeamId: '69',
      homeGoals: 2,
      awayGoals: 3,
      status: 'played',
      kickoff: '2026-11-11T19:00:00.000Z',
      venue: 'Bogdánfy_1',
    })
    expect(m?.scorers).toContainEqual({ name: 'Pap Bulcsú', teamId: '69', goals: 1 })
  })

  it('marks future matches without a link as scheduled with a synthetic id', () => {
    const upcoming = file.matches.filter((m) => m.siteId === null)
    expect(upcoming.length).toBeGreaterThan(0)
    expect(upcoming.every((m) => m.status === 'scheduled' && m.id.startsWith('x-55-L1-'))).toBe(true)
  })

  it('never invents a score for linked matches without a fetched page', () => {
    const m = file.matches.find((x) => x.id === '48305')
    expect(m).toMatchObject({ homeGoals: null, awayGoals: null, status: 'unknown', scorers: null })
  })

  it('reuses details from the previous file when not refetched', () => {
    const again = buildLeagueFile({ ...base, previous: file, details: new Map() }).file
    expect(again.matches.find((x) => x.id === '48343')).toMatchObject({ homeGoals: 2, status: 'played' })
  })

  it('ignores a match page whose team names do not fit the card', () => {
    const wrong = { ...detail, homeName: 'Valaki más' }
    const out = buildLeagueFile({ ...base, previous: null, details: new Map([[48343, { page: wrong, fetchedAt: 'x' }]]) })
    expect(out.file.matches.find((x) => x.id === '48343')?.homeGoals).toBeNull()
    expect(out.skipped[0]).toMatch(/48343/)
  })
})

describe('needsDetail', () => {
  const kickoff = '2026-11-10T19:00:00.000Z'
  it('fetches never-fetched matches', () => {
    expect(needsDetail(undefined, kickoff, now)).toBe(true)
  })
  it('refetches a match without score every run after 2 hours', () => {
    expect(needsDetail({ status: 'unknown', detailFetchedAt: '2026-11-12T11:00:00.000Z' }, kickoff, now)).toBe(false)
    expect(needsDetail({ status: 'unknown', detailFetchedAt: '2026-11-12T09:00:00.000Z' }, kickoff, now)).toBe(true)
  })
  it('refetches a played match daily only inside the 4-day upload window', () => {
    expect(needsDetail({ status: 'played', detailFetchedAt: '2026-11-11T09:00:00.000Z' }, kickoff, now)).toBe(true)
    expect(needsDetail({ status: 'played', detailFetchedAt: '2026-11-12T09:00:00.000Z' }, kickoff, now)).toBe(false)
    expect(needsDetail({ status: 'played', detailFetchedAt: '2026-11-01T09:00:00.000Z' }, '2026-10-20T19:00:00.000Z', now)).toBe(false)
  })
})
