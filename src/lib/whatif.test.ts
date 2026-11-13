import { describe, expect, it } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { applyWhatIf, parseWhatIf, serialiseWhatIf, whatIfTable } from './whatif'

const { teams, matches, standings } = leagueFixture

describe('what-if url state', () => {
  it('round-trips scores and drops junk', () => {
    const w = parseWhatIf('107:2-1,x-55-L1-202610271800-banditak-csak-oda-vissza:0-0,bad,9:-1-2')
    expect(w).toEqual(new Map([['107', [2, 1]], ['x-55-L1-202610271800-banditak-csak-oda-vissza', [0, 0]]]))
    expect(parseWhatIf(serialiseWhatIf(w))).toEqual(w)
    expect(serialiseWhatIf(new Map())).toBe('')
  })
})

describe('what-if table', () => {
  it('only overrides matches without a stored score', () => {
    const applied = applyWhatIf(matches, new Map([['101', [0, 9]], ['107', [0, 5]]]))
    expect(applied.find((m) => m.id === '101')).toMatchObject({ homeGoals: 3, awayGoals: 1 })
    expect(applied.find((m) => m.id === '107')).toMatchObject({ homeGoals: 0, awayGoals: 5, status: 'played' })
  })

  it('ranks by the rules and reports the change against the current order', () => {
    // 4 beats 1 again: 1 and 4 level on 6 points, 4 won both meetings -> 4 goes top.
    const rows = whatIfTable(teams, matches, standings, new Map([['107', [0, 5]]]))
    expect(rows.map((r) => r.teamId)).toEqual(['4', '1', '2', '3'])
    expect(rows[0]).toMatchObject({ teamId: '4', position: 1, change: 3, points: 6, played: 4 })
    expect(rows[1]).toMatchObject({ teamId: '1', change: -1 })
  })

  it('without input it equals the rule order of the stored results', () => {
    expect(whatIfTable(teams, matches, standings, new Map()).map((r) => r.change)).toEqual([0, 0, 0, 0])
  })
})
