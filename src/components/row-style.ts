const MEDAL_BG = ['--medal-1', '--medal-2', '--medal-3'].map((v) => `color-mix(in oklab, var(${v}) 16%, var(--card))`)
const STRIPE_BG = 'color-mix(in oklab, var(--foreground) 2.5%, var(--card))'

/** Row background: gold, silver, bronze for ranks 1-3, then alternating stripes by row index. */
export const rowBase = (rank: number, index: number) => MEDAL_BG[rank - 1] ?? (index % 2 === 1 ? STRIPE_BG : 'var(--card)')

/** Row colour lives in --row-bg (set --row-base inline) so sticky cells and hover switch together. */
export const ROW_CLASS =
  'bg-(--row-bg) transition-none [--row-bg:var(--row-base)] hover:bg-(--row-bg) hover:[--row-bg:color-mix(in_oklab,var(--foreground)_8%,var(--row-base))]'
