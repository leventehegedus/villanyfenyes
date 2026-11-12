import { describe, expect, it, vi } from 'vitest'
import { BudgetExceeded, politeFetcher } from './fetch'

const ok = (body: string) => new Response(body, { status: 200 })

describe('politeFetcher', () => {
  it('sends the user agent and waits between requests', async () => {
    const fetchImpl = vi.fn(async () => ok('x'))
    const sleep = vi.fn(async () => {})
    const client = politeFetcher({ userAgent: 'ua', delayMs: 100, retries: 0, budget: 5, fetchImpl, sleep })
    await client.get('https://a/1')
    await client.get('https://a/2')
    expect(fetchImpl).toHaveBeenCalledWith('https://a/1', expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': 'ua' }) }))
    expect(sleep).toHaveBeenCalledWith(100)
    expect(client.used()).toBe(2)
  })

  it('retries 5xx with exponential backoff, then succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(ok('done'))
    const sleep = vi.fn(async () => {})
    const client = politeFetcher({ userAgent: 'ua', delayMs: 10, retries: 2, budget: 5, fetchImpl, sleep })
    await expect(client.get('https://a')).resolves.toBe('done')
    expect(sleep).toHaveBeenCalledWith(20)
  })

  it('does not retry a 404', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }))
    const client = politeFetcher({ userAgent: 'ua', delayMs: 0, retries: 3, budget: 5, fetchImpl, sleep: async () => {} })
    await expect(client.get('https://a')).rejects.toThrow('404')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('stops at the request budget', async () => {
    const client = politeFetcher({ userAgent: 'ua', delayMs: 0, retries: 0, budget: 1, fetchImpl: async () => ok('x'), sleep: async () => {} })
    await client.get('https://a')
    await expect(client.get('https://b')).rejects.toBeInstanceOf(BudgetExceeded)
  })
})
