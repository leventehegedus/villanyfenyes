import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { LeagueFile, MetaFile, SCHEMA_VERSION, SeasonsFile } from '../../src/lib/schema.ts'
import { politeFetcher } from './fetch.ts'
import { fixtureSource } from './fixture-source.ts'
import { SITE, runIngest } from './run.ts'
import type { Source } from './run.ts'
import { teamFiles } from './alltime-step.ts'
import { readJson, writeIfChanged } from './write.ts'

const USER_AGENT =
  'villanyfenyes-viewer-ingest/0.1 (unofficial read-only viewer; +https://github.com/leventehegedus/villanyfenyes)'
const META_REFRESH_MS = 20 * 3_600_000

const { values } = parseArgs({
  options: {
    season: { type: 'string' },
    league: { type: 'string', multiple: true },
    'dry-run': { type: 'boolean', default: false },
    fixtures: { type: 'boolean', default: false },
    'teams-only': { type: 'boolean', default: false },
    out: { type: 'string', default: 'public/data' },
    budget: { type: 'string', default: '200' },
    delay: { type: 'string', default: '1500' },
    now: { type: 'string' },
  },
})

const positiveInt = (name: string, raw: string): number => {
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) throw new Error(`--${name} must be a positive integer, got "${raw}"`)
  return n
}

/** Writes the team files and the leaderboard; returns the changed ones. */
function writeTeamFiles(out: string, files: ReadonlyMap<string, unknown>, leaderboard: unknown) {
  const all = leaderboard ? [...files, ['leaderboard.json', leaderboard] as const] : [...files]
  return all.filter(([rel, value]) => writeIfChanged(out, rel, value))
}

/** Rebuilds teams/*.json and leaderboard.json from the league files already on disk; no requests. */
function teamsOnly(out: string): number {
  const { files, leaderboard, warnings, errors } = teamFiles(out, new Map())
  for (const w of warnings) console.log(`warn: ${w}`)
  for (const e of errors) console.error(`gate failed: ${e}`)
  if (errors.length > 0) return 1
  const changed = values['dry-run'] ? [] : writeTeamFiles(out, files, leaderboard)
  console.log(`team files ${files.size} · changed ${changed.length}${values['dry-run'] ? ' · dry run' : ''}`)
  return 0
}

async function main(): Promise<number> {
  const out = resolve(values.out)
  if (values['teams-only']) return teamsOnly(out)
  const budget = positiveInt('budget', values.budget)
  const delayMs = positiveInt('delay', values.delay)
  const now = values.now ? new Date(values.now) : new Date()
  const seasonId = values.season ? positiveInt('season', values.season) : undefined
  const client = politeFetcher({
    userAgent: USER_AGENT,
    delayMs,
    retries: 3,
    budget,
  })
  const source: Source = values.fixtures
    ? fixtureSource
    : { get: (path) => client.get(`${SITE}${path}`) }

  const result = await runIngest(source, {
    seasonId,
    leagues: values.fixtures ? ['L1'] : values.league,
    now,
    previousLeague: (s, l) => readJson(join(out, String(s), `${l}.json`), LeagueFile),
    previousSeasons: readJson(join(out, 'seasons.json'), SeasonsFile),
  })

  const { report } = result
  console.log(
    `requests ${client.used()} · files ${result.files.size} · skipped ${report.skippedRows.count} · warnings ${report.warnings.length} · mismatches ${report.mismatches.length} · pending match pages ${report.pendingMatchDetails}`,
  )
  for (const w of report.warnings.slice(0, 10)) console.log(`warn: ${w}`)
  if (result.errors.length > 0) {
    for (const e of result.errors) console.error(`gate failed: ${e}`)
    console.error('Nothing written; previous data kept.')
    return 1
  }
  // The all-time step must never block the season data: its failure only skips the team files.
  const teams = teamFiles(out, result.files)
  for (const w of teams.warnings) console.log(`warn: ${w}`)
  for (const e of teams.errors) console.error(`team files failed: ${e}`)
  if (values['dry-run']) {
    console.log(`team files ${teams.files.size}`)
    console.log('Dry run: nothing written.')
    return teams.errors.length > 0 ? 1 : 0
  }

  const changed = [...result.files].filter(([rel, value]) => writeIfChanged(out, rel, value))
  const previousMeta = readJson(join(out, 'meta.json'), MetaFile)
  const metaDue = !previousMeta || now.getTime() - Date.parse(previousMeta.generatedAt) > META_REFRESH_MS
  // A backfill must not refresh generatedAt: that would hide a failing current-season ingest.
  if (seasonId === undefined && (changed.length > 0 || metaDue)) {
    writeIfChanged(
      out,
      'meta.json',
      MetaFile.parse({
        schemaVersion: SCHEMA_VERSION,
        generatedAt: now.toISOString(),
        sourceBase: SITE,
        requests: client.used(),
        ...report,
      }),
    )
  }
  const teamsChanged = writeTeamFiles(out, teams.files, teams.leaderboard)
  console.log(`changed: ${changed.map(([rel]) => rel).join(', ') || 'none'} · team files changed ${teamsChanged.length}`)
  // Non-zero so CI notices, after the season files are safely written.
  return teams.errors.length > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err)
    process.exit(1)
  },
)
