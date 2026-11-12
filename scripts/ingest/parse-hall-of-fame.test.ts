import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseHallOfFame } from './parse-hall-of-fame'

const html = readFileSync(new URL('./__fixtures__/hall-of-fame.html', import.meta.url), 'utf8')

describe('parseHallOfFame', () => {
  const tables = parseHallOfFame(html)

  it('reads all six tables', () => {
    expect(tables).toHaveLength(6)
  })

  it('maps tables by title, not by the mislabelled header', () => {
    const playerGoals = tables.find((t) => t.key === 'playerGoals')
    expect(playerGoals).toMatchObject({ kind: 'player', metric: 'goals' })
    expect(playerGoals?.rows[0]).toEqual({ name: 'Németh Csaba', value: '207' })
    expect(tables.find((t) => t.key === 'playerSeasons')).toMatchObject({ kind: 'player', metric: 'seasons' })
    expect(tables.find((t) => t.key === 'teamWins')?.rows).toHaveLength(3)
  })

  it('keeps unknown tables with an unknown metric', () => {
    const extra = html.replace('Legtöbb győzelem', 'Új táblázat')
    expect(parseHallOfFame(extra).find((t) => t.title === 'Új táblázat')?.metric).toBe('unknown')
  })
})
