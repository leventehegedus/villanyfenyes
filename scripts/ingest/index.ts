import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { LeagueFile, MetaFile, SCHEMA_VERSION, SeasonsFile } from '../../src/lib/schema.ts'
import { politeFetcher } from './fetch.ts'
import { fixtureSource } from './fixture-source.ts'
import { SITE, runIngest } from './run.ts'
import type { Source } from './run.ts'
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

async function main(): Promise<number> {
  const out = resolve(values.out)
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
    includeHallOfFame: seasonId === undefined,
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
  if (values['dry-run']) {
    console.log('Dry run: nothing written.')
    return 0
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
  console.log(`changed: ${changed.map(([rel]) => rel).join(', ') || 'none'}`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err)
    process.exit(1)
  },
)
