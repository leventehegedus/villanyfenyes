import type { LeagueFile, Match } from '../schema'

type MatchInput = [id: string, home: string, away: string, kickoff: string, score?: [number, number]]

export const match = ([id, home, away, kickoff, score]: MatchInput): Match => ({
  id,
  siteId: id.startsWith('x-') ? null : Number(id),
  homeTeamId: home,
  awayTeamId: away,
  kickoff,
  venue: 'Bogdánfy_1',
  homeGoals: score ? score[0] : null,
  awayGoals: score ? score[1] : null,
  status: score ? 'played' : Date.parse(kickoff) > Date.parse('2026-10-20T00:00:00Z') ? 'scheduled' : 'unknown',
  scorers: score ? [] : null,
  detailFetchedAt: score ? '2026-10-19T00:00:00.000Z' : null,
})

/** Small hand-made league: a beats b, b and c draw, etc. "Now" in tests is 2026-10-20. */
export const leagueFixture: LeagueFile = {
  schemaVersion: 1,
  seasonId: 55,
  league: 'L1',
  sourceUrl: 'https://villanyfenyesbajnoksag.hu/tabella?selected_season=55&league=L1',
  teams: [
    { id: '1', siteId: 1, name: 'Árvíztűrő FC' },
    { id: '2', siteId: 2, name: 'Banditák' },
    { id: '3', siteId: 3, name: 'Csak oda-vissza' },
    { id: '4', siteId: 4, name: 'Dinamó' },
  ],
  standings: [
    { position: 1, teamId: '1', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 9, goalsAgainst: 5, goalDiff: 4, points: 6, markers: ['winStreak'] },
    { position: 2, teamId: '2', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 6, goalsAgainst: 5, goalDiff: 1, points: 4, markers: [] },
    { position: 3, teamId: '3', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 5, goalsAgainst: 7, goalDiff: -2, points: 4, markers: [] },
    { position: 4, teamId: '4', played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 4, goalsAgainst: 7, goalDiff: -3, points: 3, markers: ['relegation'] },
  ],
  matches: [
    match(['101', '1', '2', '2026-09-01T18:00:00.000Z', [3, 1]]),
    match(['102', '3', '4', '2026-09-01T19:00:00.000Z', [2, 1]]),
    match(['103', '2', '3', '2026-09-08T18:00:00.000Z', [2, 2]]),
    match(['104', '4', '1', '2026-09-08T19:00:00.000Z', [3, 2]]),
    match(['105', '1', '3', '2026-09-15T18:00:00.000Z', [4, 1]]),
    match(['106', '2', '4', '2026-09-15T19:00:00.000Z', [3, 0]]),
    match(['107', '1', '4', '2026-10-01T18:00:00.000Z']),
    match(['x-55-L1-202610271800-banditak-csak-oda-vissza', '2', '3', '2026-10-27T18:00:00.000Z']),
  ],
  summaries: [
    { teamId: '1', bestLeague: 'L1', topScorer: { name: 'Kiss Péter', goals: 5 }, seasonsCount: 3, matchesPlayed: 3 },
  ],
}
