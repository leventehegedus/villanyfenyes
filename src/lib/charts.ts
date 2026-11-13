/** The part of a Recharts click state we read. */
export type ChartClick = { activeTooltipIndex?: number | string | null; activeLabel?: string | number }

/**
 * Index of the clicked point. Recharts may report no active index (e.g. a tap without hover);
 * Number(null) is 0, so without this guard such a click would pick the first point.
 */
export function clickedIndex(state: ChartClick, labels: readonly string[]): number | null {
  const raw = state.activeTooltipIndex
  const i = raw === null || raw === undefined || raw === '' ? labels.indexOf(String(state.activeLabel)) : Number(raw)
  return Number.isInteger(i) && i >= 0 && i < labels.length ? i : null
}

/** Classes for a clickable chart: pointer cursor, no focus ring after a mouse click (keyboard keeps it). */
export const CLICKABLE_CHART = 'cursor-pointer [&_.recharts-surface:focus:not(:focus-visible)]:outline-none'
