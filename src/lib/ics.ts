import type { Match } from './schema'

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n')
const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * iCalendar text for matches with a published kickoff. No DTEND: the site does not publish
 * match length, so events carry the start time only.
 */
export function buildIcs(
  matches: readonly Match[],
  teamNames: ReadonlyMap<string, string>,
  league: string,
  now: Date,
): string {
  const name = (id: string) => teamNames.get(id) ?? id
  const events = matches.flatMap((m) =>
    m.kickoff
      ? [
          'BEGIN:VEVENT',
          `UID:${m.id}@villanyfenyes-viewer`,
          `DTSTAMP:${stamp(now.toISOString())}`,
          `DTSTART:${stamp(new Date(m.kickoff).toISOString())}`,
          `SUMMARY:${esc(`${name(m.homeTeamId)} – ${name(m.awayTeamId)} (${league})`)}`,
          ...(m.venue ? [`LOCATION:${esc(m.venue)}`] : []),
          'END:VEVENT',
        ]
      : [],
  )
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//villanyfenyes-viewer//HU',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
