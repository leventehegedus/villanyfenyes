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

/** Writes via a temp file + rename so a crash never leaves half a file. Returns false if unchanged. */
export function writeIfChanged(dir: string, rel: string, value: unknown): boolean {
  const path = join(dir, rel)
  const next = serialise(value)
  try {
    if (readFileSync(path, 'utf8') === next) return false
  } catch {
    // missing file: write it
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(`${path}.tmp`, next)
  renameSync(`${path}.tmp`, path)
  return true
}
