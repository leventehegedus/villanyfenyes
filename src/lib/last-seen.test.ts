import { describe, expect, it } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { diffSinceSnapshot, makeSnapshot } from './last-seen'

const { matches } = leagueFixture

describe('last seen', () => {
  it('is honest when there is no previous snapshot', () => {
    expect(diffSinceSnapshot(null, ['1'], matches)).toEqual({ hasSnapshot: false, since: null, newMatches: [] })
  })

  it('lists played matches of favourites that were not in the snapshot', () => {
    const snap = makeSnapshot(['1'], matches.slice(0, 4), new Date('2026-09-10T00:00:00Z'))
    const diff = diffSinceSnapshot(snap, ['1'], matches)
    expect(diff.hasSnapshot).toBe(true)
    expect(diff.since).toBe('2026-09-10T00:00:00.000Z')
    expect(diff.newMatches.map((m) => m.id)).toEqual(['105'])
  })

  it('treats a favourite added after the snapshot as having no baseline', () => {
    const snap = makeSnapshot(['1'], matches, new Date('2026-10-01T00:00:00Z'))
    expect(diffSinceSnapshot(snap, ['1', '2'], matches).newMatches).toEqual([])
  })
})
