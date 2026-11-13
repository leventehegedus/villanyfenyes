import { describe, expect, it, vi } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { buildAllTime } from './alltime'
import { DataError, fetchLeague, fetchTeam } from './data'

describe('fetchLeague', () => {
  it('loads and validates a league file, dropping invalid rows', async () => {
    const broken = { ...leagueFixture, teams: [...leagueFixture.teams, { id: '', name: '' }] }
    const fetcher = vi.fn(async () => new Response(JSON.stringify(broken)))
    const data = await fetchLeague(55, 'L1', fetcher)
    expect(fetcher).toHaveBeenCalledWith('/data/55/L1.json')
    expect(data.teams).toHaveLength(4)
  })

  it('flags a missing file, including an HTML fallback page', async () => {
    const html = async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })
    await expect(fetchLeague(55, 'L1', html)).rejects.toMatchObject({ missing: true })
    await expect(fetchLeague(55, 'L1', async () => new Response('', { status: 404 }))).rejects.toMatchObject({ missing: true })
  })

  it('throws a DataError on HTTP errors and invalid shape', async () => {
    await expect(fetchLeague(55, 'L1', async () => new Response('', { status: 404 }))).rejects.toBeInstanceOf(DataError)
    await expect(fetchLeague(55, 'L1', async () => new Response('{"x":1}'))).rejects.toBeInstanceOf(DataError)
  })
})

describe('fetchTeam', () => {
  it('loads a team all-time file from teams/<id>.json', async () => {
    const seasons = { schemaVersion: 1, currentSeasonId: 55, seasons: [], leagues: {} }
    const file = buildAllTime([{ seasonId: 55, league: 'L1', file: leagueFixture }], seasons).get('1')
    const fetcher = vi.fn(async () => new Response(JSON.stringify(file)))
    const data = await fetchTeam('1', fetcher)
    expect(fetcher).toHaveBeenCalledWith('/data/teams/1.json')
    expect(data.names).toEqual(['Árvíztűrő FC'])
  })
})
