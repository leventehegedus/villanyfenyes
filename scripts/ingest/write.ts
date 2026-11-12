import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ZodType } from 'zod'

export const serialise = (value: unknown) => `${JSON.stringify(value, null, 1)}\n`

/** Reads and validates a JSON file; null when missing or invalid. */
export function readJson<T>(path: string, schema: ZodType<T>): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

// Fetch timestamps alone are not a data change: they would make every run commit and redeploy.
// shortcut: the stored detailFetchedAt then lags, so recent matches are refetched more often (bounded by --budget); move fetch times to an uncommitted cache if requests become a concern.
const withoutFetchTimes = (json: string) => json.replace(/"detailFetchedAt": (?:"[^"]*"|null)/g, '')

/** Writes via a temp file + rename so a crash never leaves half a file. Returns false if unchanged. */
export function writeIfChanged(dir: string, rel: string, value: unknown): boolean {
  const path = join(dir, rel)
  const next = serialise(value)
  try {
    if (withoutFetchTimes(readFileSync(path, 'utf8')) === withoutFetchTimes(next)) return false
  } catch {
    // missing file: write it
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(`${path}.tmp`, next)
  renameSync(`${path}.tmp`, path)
  return true
}
