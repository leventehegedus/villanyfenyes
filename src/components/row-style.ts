import type { CSSProperties } from 'react'

const MEDAL_BG = ['--medal-1', '--medal-2', '--medal-3'].map((v) => `color-mix(in oklab, var(${v}) 16%, var(--background))`)
// Same two colours as the match lists: page background and a faint stripe.
const STRIPE_BG = 'var(--stripe)'

/** Alternating backgrounds for the <li> children of a list. */
export const STRIPED_LIST = '[&>li:nth-child(even)]:bg-(--stripe)'

/** Row background: gold, silver, bronze for ranks 1-3, then alternating stripes by row index. */
export const rowBase = (rank: number, index: number) => MEDAL_BG[rank - 1] ?? (index % 2 === 1 ? STRIPE_BG : 'var(--background)')

/** Row colour lives in --row-bg (set --row-base inline) so sticky cells and hover switch together. */
export const ROW_CLASS =
  'bg-(--row-bg) transition-none [--row-bg:var(--row-base)] hover:bg-(--row-bg) hover:[--row-bg:color-mix(in_oklab,var(--foreground)_8%,var(--row-base))]'

/** Props for a table row coloured by rank (1-3 medals) and index (stripes). */
export const rowProps = (rank: number | null, index: number) => ({
  style: { '--row-base': rowBase(rank ?? 0, index) } as CSSProperties,
  className: ROW_CLASS,
})
