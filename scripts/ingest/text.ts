/** Collapses whitespace and trims. */
export const clean = (s: string | undefined | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

/** Integer from text like "+24", "-3", "8"; null when not a plain integer. */
export function toInt(s: string | undefined | null): number | null {
  const t = clean(s)
  return /^[+-]?\d+$/.test(t) ? Number.parseInt(t, 10) : null
}

/** Lowercase ASCII slug, accents removed. */
export const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
