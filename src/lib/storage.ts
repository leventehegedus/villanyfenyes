import type { ZodType } from 'zod'

const PREFIX = 'vf:'

/** Reads a validated value from localStorage; any failure returns the fallback. */
export function readStored<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // storage full or blocked: the app keeps working without persistence
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

/** Removes every key this app wrote. */
export function clearAllStored(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    for (const k of keys) if (k?.startsWith(PREFIX)) localStorage.removeItem(k)
  } catch {
    // ignore
  }
}
