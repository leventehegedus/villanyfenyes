export const SITE_TIME_ZONE = 'Europe/Budapest'

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/

/** Offset of `timeZone` from UTC at the given instant, in milliseconds. */
function zoneOffset(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - utcMs
}

/** Converts site wall time ("2026-11-11 20:00:00", Europe/Budapest) to a UTC ISO string. */
export function budapestLocalToUtc(local: string): string | null {
  const m = LOCAL.exec(local.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0))
  // Two passes settle the offset around DST switches.
  let utc = wall - zoneOffset(wall, SITE_TIME_ZONE)
  utc = wall - zoneOffset(utc, SITE_TIME_ZONE)
  return Number.isNaN(utc) ? null : new Date(utc).toISOString()
}
