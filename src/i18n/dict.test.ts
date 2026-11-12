import { describe, expect, it } from 'vitest'
import { dictionaries, translate } from './dict'

describe('i18n', () => {
  it('has the same placeholders in both languages', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(dictionaries.hu) as (keyof typeof dictionaries.hu)[]) {
      expect(vars(dictionaries.en[key]), key).toEqual(vars(dictionaries.hu[key]))
    }
  })
  it('interpolates variables', () => {
    expect(translate('en', 'weekOf', { date: 'Nov 9' })).toBe('Week of Nov 9')
  })
})
