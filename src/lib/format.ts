export type Locale = 'hu' | 'en'

export function formatKickoff(iso: string | null, locale: Locale, timeZone: string): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(iso))
}

export function formatDay(iso: string, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone }).format(new Date(iso))
}

/** Compact kickoff for lists: weekday, day and time without the year. */
export function formatKickoffShort(iso: string | null, locale: Locale, timeZone: string): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export function formatDecimal(n: number | null, locale: Locale): string | null {
  return n === null ? null : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n)
}

export function isStale(generatedAt: string, now: Date, hours: number): boolean {
  const t = Date.parse(generatedAt)
  return Number.isNaN(t) || now.getTime() - t > hours * 3_600_000
}

/** "3 hours ago" style text via Intl.RelativeTimeFormat. */
export function formatAge(iso: string, now: Date, locale: Locale): string {
  const minutes = Math.round((Date.parse(iso) - now.getTime()) / 60_000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}
