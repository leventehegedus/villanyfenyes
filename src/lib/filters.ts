/** Lowercase, accent-free text for search (á -> a, ő -> o, ű -> u). */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export const includesFolded = (text: string, query: string): boolean => fold(text).includes(fold(query))

export type SortDir = 'asc' | 'desc'

/** Returns a sorted copy; null values always last. */
export function sortRows<T>(rows: readonly T[], key: (row: T) => number | string | null, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = key(a)
    const y = key(b)
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
    return sign * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'hu'))
  })
}
