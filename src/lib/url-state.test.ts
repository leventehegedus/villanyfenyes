import { describe, expect, it } from 'vitest'
import { parseStandingsSort, readMatchFilters } from './url-state'

describe('url state', () => {
  it('reads match filters with defaults', () => {
    expect(readMatchFilters(new URLSearchParams('t=69&st=played&fav=1'), 'upcoming')).toEqual({ teamId: '69', status: 'played', favOnly: true })
    expect(readMatchFilters(new URLSearchParams('st=bogus'), 'upcoming')).toEqual({ teamId: null, status: 'upcoming', favOnly: false })
  })
  it('parses the standings sort and rejects junk', () => {
    expect(parseStandingsSort('points:desc')).toEqual({ key: 'points', dir: 'desc' })
    expect(parseStandingsSort('name:desc')).toEqual({ key: 'position', dir: 'asc' })
    expect(parseStandingsSort(null)).toEqual({ key: 'position', dir: 'asc' })
  })
})
