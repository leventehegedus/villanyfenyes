import { describe, expect, it } from 'vitest'
import { parseStandingsSort, readHighlight, readMatchFilters, toggleHighlight, writeHighlight } from './url-state'

describe('url state', () => {
  it('reads match filters with defaults', () => {
    expect(readMatchFilters(new URLSearchParams('t=69,100&st=past'), 'upcoming')).toEqual({ teamIds: ['69', '100'], status: 'past' })
    expect(readMatchFilters(new URLSearchParams('st=bogus'), 'upcoming')).toEqual({ teamIds: [], status: 'upcoming' })
  })
  it('parses the standings sort and rejects junk', () => {
    expect(parseStandingsSort('points:desc')).toEqual({ key: 'points', dir: 'desc' })
    expect(parseStandingsSort('name:desc')).toEqual({ key: 'position', dir: 'asc' })
    expect(parseStandingsSort(null)).toEqual({ key: 'position', dir: 'asc' })
  })
})

describe('chart highlight', () => {
  const ids = ['1', '2', '3', '4', '5']
  it('reads known ids from the URL, else falls back', () => {
    expect(readHighlight('2,9,1', ids, ['5'])).toEqual(['2', '1'])
    expect(readHighlight(null, ids, ['5'])).toEqual(['5'])
    expect(readHighlight('', ids, ['5'])).toEqual([])
    expect(readHighlight(writeHighlight([]), ids, ['5'])).toEqual([])
    expect(writeHighlight(['1', '2'])).toBe('1,2')
  })
  it('toggles without a limit', () => {
    expect(toggleHighlight(['1', '2'], '2')).toEqual(['1'])
    expect(toggleHighlight(['1', '2', '3', '4', '5'], '6')).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(readHighlight('1,2,3,4,5', ids, [])).toHaveLength(5)
  })
})
