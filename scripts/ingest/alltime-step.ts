import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { buildAllTime, buildLeaderboard, duplicateNames } from '../../src/lib/alltime.ts'
import type { SeasonLeague } from '../../src/lib/alltime.ts'
import { LeaderboardFile, LeagueFile, SCHEMA_VERSION, SeasonsFile, TeamAllTimeFile } from '../../src/lib/schema.ts'
import { readJson } from './write.ts'

const LEAGUE_FILE = /^(\d+)\/(L[1-5][A-H]?)\.json$/

/** League file paths ("55/L1.json") under `out`; only numeric season folders. */
function leaguePaths(out: string): string[] {
  let dirs: string[]
  try {
    dirs = readdirSync(out).filter((d) => /^\d+$/.test(d))
  } catch {
    return []
  }
  return dirs.flatMap((d) => readdirSync(join(out, d)).map((f) => `${d}/${f}`)).filter((p) => LEAGUE_FILE.test(p))
}

/**
 * Per-team all-time files ("teams/<id>.json") from every league file on disk, with this run's
 * `produced` files taking precedence. Reads local files only.
 */
export function teamFiles(out: string, produced: ReadonlyMap<string, unknown>) {
  const errors: string[] = []
  const paths = [...new Set([...leaguePaths(out), ...[...produced.keys()].filter((p) => LEAGUE_FILE.test(p))])].sort()
  const inputs: SeasonLeague[] = []
  for (const rel of paths) {
    const fresh = produced.has(rel) ? LeagueFile.safeParse(produced.get(rel)) : null
    const file = fresh ? (fresh.success ? fresh.data : null) : readJson(join(out, rel), LeagueFile)
    if (file) inputs.push({ seasonId: file.seasonId, league: file.league, file })
    else errors.push(`${rel}: invalid league file`)
  }
  const producedSeasons = SeasonsFile.safeParse(produced.get('seasons.json'))
  const seasons = producedSeasons.success ? producedSeasons.data : readJson(join(out, 'seasons.json'), SeasonsFile)
  if (!seasons) errors.push('seasons.json: missing or invalid')

  const files = new Map<string, TeamAllTimeFile>()
  if (errors.length > 0 || !seasons) return { files, leaderboard: null, warnings: [], errors }
  for (const [teamId, value] of buildAllTime(inputs, seasons)) {
    const valid = TeamAllTimeFile.safeParse(value)
    if (valid.success) files.set(`teams/${teamId}.json`, valid.data)
    else errors.push(`teams/${teamId}.json: ${valid.error.issues[0]?.message ?? 'invalid'}`)
  }
  const warnings = duplicateNames(inputs).map((d) => `team name "${d.name}" has several ids: ${d.ids.join(', ')}`)
  if (errors.length > 0) return { files: new Map<string, TeamAllTimeFile>(), leaderboard: null, warnings, errors }
  const leaderboard = LeaderboardFile.parse({ schemaVersion: SCHEMA_VERSION, rows: buildLeaderboard(files.values()) })
  return { files, leaderboard, warnings, errors }
}
