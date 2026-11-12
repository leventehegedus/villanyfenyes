import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { readStored, removeStored, writeStored } from './storage'

const mem = new Map<string, string>()
beforeEach(() => {
  mem.clear()
  globalThis.localStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
    removeItem: (k) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  }
})

describe('storage', () => {
  const Schema = z.array(z.string())

  it('round-trips valid values', () => {
    writeStored('fav', ['1'])
    expect(readStored('fav', Schema, [])).toEqual(['1'])
  })

  it('falls back on corrupt or invalid data', () => {
    mem.set('vf:fav', '{nope')
    expect(readStored('fav', Schema, [])).toEqual([])
    mem.set('vf:fav', '[1,2]')
    expect(readStored('fav', Schema, ['x'])).toEqual(['x'])
  })

  it('survives a throwing storage', () => {
    globalThis.localStorage.getItem = () => {
      throw new Error('denied')
    }
    expect(readStored('fav', Schema, [])).toEqual([])
    expect(() => writeStored('fav', [])).not.toThrow()
    expect(() => removeStored('fav')).not.toThrow()
  })
})
