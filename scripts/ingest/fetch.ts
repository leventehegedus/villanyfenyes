export class BudgetExceeded extends Error {
  constructor(budget: number) {
    super(`request budget of ${budget} reached`)
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`)
  }
}

type Options = {
  userAgent: string
  delayMs: number
  retries: number
  budget: number
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>
  sleep?: (ms: number) => Promise<void>
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const retryable = (status: number) => status === 429 || status >= 500

/** Sequential GET client: one request at a time, a delay between requests, retries, hard budget. */
export function politeFetcher({ userAgent, delayMs, retries, budget, fetchImpl = fetch, sleep = realSleep }: Options) {
  let used = 0
  let queue: Promise<unknown> = Promise.resolve()

  async function attempt(url: string): Promise<string> {
    for (let i = 0; ; i++) {
      if (used >= budget) throw new BudgetExceeded(budget)
      if (used > 0) await sleep(i === 0 ? delayMs : delayMs * 2 ** i)
      used += 1
      try {
        const res = await fetchImpl(url, {
          headers: { 'User-Agent': userAgent, Accept: 'text/html' },
          redirect: 'follow',
          signal: AbortSignal.timeout(30_000),
        })
        if (res.ok) return await res.text()
        if (!retryable(res.status) || i >= retries) throw new HttpError(res.status, url)
      } catch (err) {
        if (err instanceof HttpError || i >= retries) throw err
      }
    }
  }

  return {
    get(url: string): Promise<string> {
      const next = queue.then(() => attempt(url))
      queue = next.catch(() => undefined)
      return next
    },
    used: () => used,
  }
}
