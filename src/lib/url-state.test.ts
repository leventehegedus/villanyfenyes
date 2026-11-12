import { describe, expect, it } from 'vitest'
import { parseStandingsSort, readHighlight, readMatchFilters, toggleHighlight } from './url-state'

describe('url state', () => {
  it('reads match filters with defaults', () => {
    expect(readMatchFilters(new URLSearchParams('t=69&st=past&fav=1'), 'upcoming')).toEqual({ teamId: '69', status: 'past', favOnly: true })
    expect(readMatchFilters(new URLSearchParams('st=bogus'), 'upcoming')).toEqual({ teamId: null, status: 'upcoming', favOnly: false })
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
  })
  it('toggles and keeps at most four, dropping the oldest', () => {
    expect(toggleHighlight(['1', '2'], '2')).toEqual(['1'])
    expect(toggleHighlight(['1', '2', '3', '4'], '5')).toEqual(['2', '3', '4', '5'])
  })
})
