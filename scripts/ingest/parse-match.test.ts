import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseMatchPage } from './parse-match'

const html = readFileSync(new URL('./__fixtures__/match-played.html', import.meta.url), 'utf8')

describe('parseMatchPage', () => {
  it('reads teams, league, season, venue, kickoff and score', () => {
    expect(parseMatchPage(html)).toMatchObject({
      homeName: 'Gyermekláncfűrész',
      awayName: 'Lokomotív MFC',
      league: 'L1',
      seasonLabel: '2026 - Ősz',
      venue: 'Bogdánfy_1',
      kickoff: '2026-11-11 20:00:00',
      homeGoals: 2,
      awayGoals: 3,
    })
  })

  it('keeps only players who scored', () => {
    const page = parseMatchPage(html)
    expect(page.homeScorers).toEqual([
      { name: 'Horváth Dávid', goals: 1 },
      { name: 'Füle András', goals: 1 },
    ])
    expect(page.awayScorers.map((s) => s.name)).toEqual(['Alács Mihály', 'Kele Balázs', 'Pap Bulcsú'])
  })

  it('returns a null score when the result is missing', () => {
    const page = parseMatchPage(html.replace(/<span>2 <small>:<\/small> 3<\/span>/, '<span>- <small>:</small> -</span>'))
    expect(page.homeGoals).toBeNull()
    expect(page.awayGoals).toBeNull()
  })

  it('does not throw on unrelated HTML', () => {
    expect(parseMatchPage('<p>x</p>')).toMatchObject({ homeName: null, homeGoals: null, homeScorers: [] })
  })
})
