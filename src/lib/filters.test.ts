import { describe, expect, it } from 'vitest'
import { fold, includesFolded, sortRows } from './filters'

describe('filters', () => {
  it('folds accents and case', () => {
    expect(fold('Gyermekláncfűrész')).toBe('gyermeklancfuresz')
    expect(includesFolded('Lokomotív MFC', 'LOKOMOTIV')).toBe(true)
    expect(includesFolded('Borg', 'x')).toBe(false)
    expect(includesFolded('Borg', '  ')).toBe(true)
  })

  it('sorts rows by a key in both directions without mutating', () => {
    const rows = [{ n: 2 }, { n: 1 }, { n: 3 }]
    expect(sortRows(rows, (r) => r.n, 'asc').map((r) => r.n)).toEqual([1, 2, 3])
    expect(sortRows(rows, (r) => r.n, 'desc').map((r) => r.n)).toEqual([3, 2, 1])
    expect(rows.map((r) => r.n)).toEqual([2, 1, 3])
  })

  it('puts null values last in both directions', () => {
    const rows = [{ n: null }, { n: 1 }]
    expect(sortRows(rows, (r) => r.n, 'desc')[1]?.n).toBeNull()
    expect(sortRows(rows, (r) => r.n, 'asc')[1]?.n).toBeNull()
  })
})
