import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('ingest CLI', () => {
  it('still writes the season files when the team step fails, and exits non-zero', () => {
    const out = mkdtempSync(join(tmpdir(), 'ingest-cli-'))
    mkdirSync(join(out, '40'))
    writeFileSync(join(out, '40', 'L1.json'), '{}')
    const run = spawnSync('pnpm', ['-s', 'tsx', 'scripts/ingest/index.ts', '--fixtures', '--out', out, '--now', '2026-11-12T12:00:00Z'], {
      encoding: 'utf8',
    })
    expect(run.stderr).toContain('40/L1.json: invalid league file')
    expect(run.status).toBe(1)
    expect(existsSync(join(out, '55', 'L1.json'))).toBe(true)
    expect(existsSync(join(out, 'teams'))).toBe(false)
  }, 60_000)
})
