import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import { clean, toInt } from './text.ts'

export type ParsedGoal = { name: string; goals: number }

export type ParsedMatchPage = {
  homeName: string | null
  awayName: string | null
  league: string | null
  seasonLabel: string | null
  venue: string | null
  kickoff: string | null
  homeGoals: number | null
  awayGoals: number | null
  homeScorers: ParsedGoal[]
  awayScorers: ParsedGoal[]
}

const VENUE_KICKOFF = /^(.*?)\s*-\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?)$/
const SCORE = /^(\d+)\s*:\s*(\d+)$/

function scorers($: CheerioAPI, selector: string): ParsedGoal[] {
  return $(`${selector} .goal-result-item`)
    .toArray()
    .flatMap((el) => {
      const divs = $(el).children('div')
      const name = clean(divs.first().text())
      const goals = toInt(divs.eq(1).text())
      // Players listed with 0 goals are roster members, not scorers.
      return name && goals !== null && goals > 0 ? [{ name, goals }] : []
    })
}

/** Parses a `/tabella/{matchId}/eredmenyek/{teamId}` page. Never throws. */
export function parseMatchPage(html: string): ParsedMatchPage {
  const $ = cheerio.load(html)
  const score = $('.sportsmagazine-overview-score')
  const when = VENUE_KICKOFF.exec(clean(score.find('time').text()))
  const result = SCORE.exec(clean(score.children('span').first().text()))
  const team = (side: string) => clean($(`.sportsmagazine-overview-team-${side} h4`).first().text()) || null
  const league = clean($('.sportsmagazine-overview-team-one span span').first().text()) || null
  return {
    homeName: team('one'),
    awayName: team('two'),
    league,
    seasonLabel: clean(score.find('h5').first().text()) || null,
    venue: when?.[1] || null,
    kickoff: when?.[2] ?? null,
    homeGoals: result ? Number(result[1]) : null,
    awayGoals: result ? Number(result[2]) : null,
    homeScorers: scorers($, '#team1Results'),
    awayScorers: scorers($, '#team2Results'),
  }
}
