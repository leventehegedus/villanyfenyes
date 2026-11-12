import * as cheerio from 'cheerio'
import type { Cheerio, CheerioAPI } from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { Marker, Season } from '../../src/lib/schema.ts'
import { clean, toInt } from './text.ts'

export type FixtureCard = {
  teams: string
  venue: string | null
  kickoff: string | null
  matchId: number | null
  ownerTeamId: number | null
}

export type ParsedSummary = {
  bestLeague: string | null
  topScorer: { name: string; goals: number } | null
  seasonsCount: number | null
  matchesPlayed: number | null
}

export type ParsedRow = {
  position: number
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  markers: Marker[]
  cards: FixtureCard[]
  summary: ParsedSummary
}

export type ParsedStandingsPage = {
  seasons: Season[]
  selectedSeasonId: number | null
  leagues: string[]
  selectedLeague: string | null
  rows: ParsedRow[]
  skipped: string[]
}

const ICON_MARKERS: Record<string, Marker> = {
  check: 'promotion',
  xmark: 'relegation',
  fire: 'winStreak',
  ice: 'lossStreak',
  ball: 'manyGoals',
  goalkeeper: 'fewConceded',
}

const COLUMNS = {
  MSZ: 'played',
  Gy: 'won',
  D: 'drawn',
  V: 'lost',
  LG: 'goalsFor',
  KG: 'goalsAgainst',
  GK: 'goalDiff',
  Pont: 'points',
} as const

type NumericKey = (typeof COLUMNS)[keyof typeof COLUMNS]

const RESULT_LINK = /\/tabella\/(\d+)\/eredmenyek\/(\d+)/
const SEASON_OPTION = /^(.*?)\s*:\s*(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/

function seasonHalf(label: string): Season['half'] {
  const l = label.toLowerCase()
  if (l.includes('tavasz')) return 'tavasz'
  if (l.includes('nyár') || l.includes('nyar')) return 'nyar'
  if (l.includes('ősz') || l.includes('osz')) return 'osz'
  return 'unknown'
}

export function parseSeasonOption(id: number, text: string): Season {
  const t = clean(text)
  const m = SEASON_OPTION.exec(t)
  const label = clean(m?.[1] ?? t).replace(/\s*-\s*/, ' - ')
  const year = /^(\d{4})/.exec(label)?.[1]
  return {
    id,
    label,
    year: year ? Number(year) : null,
    half: seasonHalf(label),
    start: m?.[2] ?? null,
    end: m?.[3] ?? null,
  }
}

function parseSeasons($: CheerioAPI) {
  const seasons: Season[] = []
  let selectedSeasonId: number | null = null
  $('#seasonSelect option').each((_, el) => {
    const id = toInt($(el).attr('value'))
    if (id === null) return
    seasons.push(parseSeasonOption(id, $(el).text()))
    if ($(el).is('[selected]')) selectedSeasonId = id
  })
  return { seasons, selectedSeasonId }
}

function parseLeagues($: CheerioAPI) {
  const leagues: string[] = []
  let selectedLeague: string | null = null
  $('#leagueSelect option').each((_, el) => {
    const code = clean($(el).attr('value'))
    if (!code) return
    leagues.push(code)
    // Some pages mark several options selected; the browser shows the last one.
    if ($(el).is('[selected]')) selectedLeague = code
  })
  return { leagues, selectedLeague }
}

function parseCards($: CheerioAPI, extra: Cheerio<AnyNode>): FixtureCard[] {
  return extra
    .find('.match-card')
    .toArray()
    .map((el) => {
      const card = $(el)
      const link = RESULT_LINK.exec(card.find('a[href]').attr('href') ?? '')
      return {
        teams: clean(card.find('.team').text()),
        venue: clean(card.find('.field').text()) || null,
        kickoff: clean(card.find('.date').text()) || null,
        matchId: link ? Number(link[1]) : null,
        ownerTeamId: link ? Number(link[2]) : null,
      }
    })
}

function summaryValue($: CheerioAPI, extra: Cheerio<AnyNode>, label: string): string | null {
  // Leaf divs only: when the value is empty the parent's text equals the label too.
  const labelEl = extra
    .find('div')
    .filter((_, el) => $(el).children().length === 0 && clean($(el).text()) === label)
  return clean(labelEl.first().next().text()) || null
}

function parseSummary($: CheerioAPI, extra: Cheerio<AnyNode>): ParsedSummary {
  const scorer = summaryValue($, extra, 'Legtöbb gólt szerző játékos:')
  const scorerMatch = scorer ? /^(.*\S)\s*\((\d+)\)$/.exec(scorer) : null
  const seasons = summaryValue($, extra, 'Szezonok száma:')
  const played = summaryValue($, extra, 'Lejátszott mérkőzések száma:')
  return {
    bestLeague: summaryValue($, extra, 'Legjobb liga:'),
    topScorer: scorerMatch?.[1] ? { name: scorerMatch[1], goals: Number(scorerMatch[2]) } : null,
    seasonsCount: toInt(seasons),
    matchesPlayed: toInt(played),
  }
}

function parseRow($: CheerioAPI, row: Cheerio<AnyNode>): ParsedRow | string {
  const teamName = row.find('.teamName')
  const name = clean(teamName.children('div').last().text())
  if (!name) return 'row without team name'
  const position = toInt(teamName.children('div').first().children('div').first().text())
  if (position === null) return `${name}: missing position`

  const numbers: Partial<Record<NumericKey, number>> = {}
  for (const col of row.find('.tabella-col').toArray()) {
    const divs = $(col).children('div')
    const label = clean(divs.first().text())
    if (!(label in COLUMNS)) continue
    const value = toInt(divs.eq(1).text())
    if (value === null) return `${name}: non-numeric ${label}`
    numbers[COLUMNS[label as keyof typeof COLUMNS]] = value
  }
  const missing = Object.values(COLUMNS).filter((k) => numbers[k] === undefined)
  if (missing.length > 0) return `${name}: missing ${missing.join(', ')}`

  const markers = row
    .find('img[src*="/images/icons/"]')
    .toArray()
    .map((el) => /icons\/(\w+)\.png/.exec($(el).attr('src') ?? '')?.[1] ?? '')
    .flatMap((icon) => (ICON_MARKERS[icon] ? [ICON_MARKERS[icon]] : []))

  const extra = row.next('.extra-row')
  return {
    position,
    name,
    played: numbers.played ?? 0,
    won: numbers.won ?? 0,
    drawn: numbers.drawn ?? 0,
    lost: numbers.lost ?? 0,
    goalsFor: numbers.goalsFor ?? 0,
    goalsAgainst: numbers.goalsAgainst ?? 0,
    goalDiff: numbers.goalDiff ?? 0,
    points: numbers.points ?? 0,
    markers,
    cards: parseCards($, extra),
    summary: parseSummary($, extra),
  }
}

/** Parses a `/tabella` page. Never throws; invalid rows land in `skipped`. */
export function parseStandingsPage(html: string): ParsedStandingsPage {
  const $ = cheerio.load(html)
  const rows: ParsedRow[] = []
  const skipped: string[] = []
  $('.tabella-box > .tabella-row')
    .slice(1)
    .each((_, el) => {
      const parsed = parseRow($, $(el))
      if (typeof parsed === 'string') skipped.push(parsed)
      else rows.push(parsed)
    })
  return { ...parseSeasons($), ...parseLeagues($), rows, skipped }
}
