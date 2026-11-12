import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseStandingsPage } from './parse-standings'

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8')

describe('parseStandingsPage (current season)', () => {
  const page = parseStandingsPage(fixture('standings-current-L1.html'))

  it('reads the season list with ids, labels and dates', () => {
    expect(page.selectedSeasonId).toBe(55)
    expect(page.seasons[0]).toEqual({
      id: 55,
      label: '2026 - Ősz',
      year: 2026,
      half: 'osz',
      start: '2026-08-31',
      end: '2026-12-18',
    })
    expect(page.seasons.find((s) => s.id === 54)?.half).toBe('nyar')
  })

  it('reads the league list and the selected league', () => {
    expect(page.leagues).toContain('L5H')
    expect(page.leagues).toHaveLength(19)
    expect(page.selectedLeague).toBe('L1')
  })

  it('reads every standings row with numbers and markers', () => {
    expect(page.rows).toHaveLength(12)
    const first = page.rows[0]
    expect(first).toMatchObject({
      position: 1,
      name: 'Lokomotív MFC',
      played: 8,
      won: 7,
      drawn: 0,
      lost: 1,
      goalsFor: 44,
      goalsAgainst: 20,
      goalDiff: 24,
      points: 21,
      markers: ['winStreak', 'manyGoals', 'fewConceded'],
    })
    expect(page.rows.at(-1)?.markers).toContain('relegation')
    expect(page.rows.at(-1)?.goalDiff).toBeLessThan(0)
  })

  it('reads fixture cards with venue, kickoff and result link ids', () => {
    const cards = page.rows[0]?.cards ?? []
    expect(cards).toHaveLength(11)
    expect(cards[0]).toEqual({
      teams: 'Lokomotív MFC - 2 zenész',
      venue: 'Bogdánfy_1',
      kickoff: '2026-09-24 21:00:00',
      matchId: 48305,
      ownerTeamId: 69,
    })
    expect(cards.at(-1)?.matchId).toBeNull()
  })

  it('reads the team summary as published', () => {
    expect(page.rows[0]?.summary).toEqual({
      bestLeague: 'L1',
      topScorer: { name: 'Mogyorósi Zoltán', goals: 12 },
      seasonsCount: 22,
      matchesPlayed: 8,
    })
  })
})

describe('parseStandingsPage (old season)', () => {
  const page = parseStandingsPage(fixture('standings-old-L2A.html'))

  it('picks the last selected league option like a browser does', () => {
    expect(page.selectedSeasonId).toBe(10)
    expect(page.selectedLeague).toBe('L2A')
  })

  it('reads promotion markers and empty summary fields as null', () => {
    expect(page.rows[0]?.markers).toContain('promotion')
    expect(page.rows[0]?.summary.bestLeague).toBeNull()
    expect(page.rows[0]?.summary.topScorer).toBeNull()
  })
})

describe('parseStandingsPage (broken input)', () => {
  it('returns empty lists instead of throwing', () => {
    const page = parseStandingsPage('<html><body><p>Hiba</p></body></html>')
    expect(page.rows).toEqual([])
    expect(page.seasons).toEqual([])
    expect(page.selectedSeasonId).toBeNull()
  })

  it('skips a row with a non-numeric value and records why', () => {
    const html = fixture('standings-current-L1.html').replace('<div>MSZ</div><div>8</div>', '<div>MSZ</div><div>?</div>')
    const page = parseStandingsPage(html)
    expect(page.rows).toHaveLength(11)
    expect(page.skipped[0]).toMatch(/Lokomotív MFC/)
  })
})
