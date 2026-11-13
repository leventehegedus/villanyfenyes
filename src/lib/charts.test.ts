import { describe, expect, it } from 'vitest'
import { clickedIndex } from './charts'

describe('clickedIndex', () => {
  const labels = ['9. 1.', '9. 8.', '9. 15.']
  it('uses the active tooltip index', () => {
    expect(clickedIndex({ activeTooltipIndex: '2' }, labels)).toBe(2)
    expect(clickedIndex({ activeTooltipIndex: 1 }, labels)).toBe(1)
  })
  it('falls back to the active label instead of reading null as the first point', () => {
    expect(clickedIndex({ activeTooltipIndex: null, activeLabel: '9. 8.' }, labels)).toBe(1)
    expect(clickedIndex({ activeTooltipIndex: null }, labels)).toBeNull()
  })
  it('ignores indexes outside the data', () => {
    expect(clickedIndex({ activeTooltipIndex: 7 }, labels)).toBeNull()
  })
})
