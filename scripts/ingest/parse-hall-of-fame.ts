import * as cheerio from 'cheerio'
import type { HallOfFameTable } from '../../src/lib/schema.ts'
import { clean, slug } from './text.ts'

type TableDef = Pick<HallOfFameTable, 'key' | 'kind' | 'metric'>

// Keyed by the h4 title; the site's column headers are unreliable.
const TITLES: Record<string, TableDef> = {
  'Legtöbb lejátszott szezon': { key: 'teamSeasons', kind: 'team', metric: 'seasons' },
  'Legtöbb rúgott gól - csapat': { key: 'teamGoals', kind: 'team', metric: 'goals' },
  'Legtöbb rúgott gól a ligában - játékos': { key: 'playerGoals', kind: 'player', metric: 'goals' },
  'Legtöbb győzelem': { key: 'teamWins', kind: 'team', metric: 'wins' },
  'Legrégebbi aktív csapat': { key: 'teamOldest', kind: 'team', metric: 'firstSeason' },
  'Legtöbb szezon a bajnokságban - játékos': { key: 'playerSeasons', kind: 'player', metric: 'seasons' },
}

/** Parses `/hiressegek-csarnoka`. Never throws. */
export function parseHallOfFame(html: string): HallOfFameTable[] {
  const $ = cheerio.load(html)
  return $('.sportsmagazine-roster-graph')
    .toArray()
    .flatMap((el) => {
      const title = clean($(el).find('h4').first().text())
      if (!title) return []
      const def = TITLES[title] ?? {
        key: slug(title),
        kind: title.includes('játékos') ? 'player' : 'team',
        metric: 'unknown',
      }
      const rows = $(el)
        .find('tr')
        .toArray()
        .flatMap((tr) => {
          const cells = $(tr).children('td')
          const name = clean(cells.eq(0).text())
          return cells.length >= 2 && name ? [{ name, value: clean(cells.eq(1).text()) }] : []
        })
      return [{ ...def, title, rows }]
    })
}
