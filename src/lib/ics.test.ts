import { describe, expect, it } from 'vitest'
import { leagueFixture } from './__fixtures__/league'
import { buildIcs } from './ics'

const names = new Map(leagueFixture.teams.map((t) => [t.id, t.name]))

describe('buildIcs', () => {
  const ics = buildIcs(leagueFixture.matches.slice(6), names, 'L1', new Date('2026-10-20T00:00:00Z'))

  it('creates one event per match with a kickoff, in UTC', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain('DTSTART:20261027T180000Z')
    expect(ics).toContain('SUMMARY:Banditák – Csak oda-vissza (L1)')
    expect(ics).toContain('LOCATION:Bogdánfy_1')
  })

  it('skips matches without a kickoff and escapes text', () => {
    const m = { ...leagueFixture.matches[6]!, kickoff: null }
    expect(buildIcs([m], names, 'L1', new Date())).not.toContain('BEGIN:VEVENT')
    const odd = new Map([...names, ['1', 'A, B; C']])
    expect(buildIcs(leagueFixture.matches.slice(6, 7), odd, 'L1', new Date())).toContain(String.raw`A\, B\; C`)
  })
})
