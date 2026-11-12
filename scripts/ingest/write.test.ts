import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeIfChanged } from './write'

describe('writeIfChanged', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vf-write-'))
  const match = (score: number | null, at: string) => ({ matches: [{ homeGoals: score, detailFetchedAt: at }] })

  it('writes new files and real changes', () => {
    expect(writeIfChanged(dir, 'a/b.json', match(null, 't1'))).toBe(true)
    expect(writeIfChanged(dir, 'a/b.json', match(2, 't2'))).toBe(true)
    expect(JSON.parse(readFileSync(join(dir, 'a/b.json'), 'utf8')).matches[0].homeGoals).toBe(2)
  })

  it('skips changes that only touch fetch timestamps', () => {
    expect(writeIfChanged(dir, 'a/b.json', match(2, 't3'))).toBe(false)
  })
})
