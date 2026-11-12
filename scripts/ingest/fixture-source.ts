import { readFileSync } from 'node:fs'
import { HttpError } from './fetch.ts'
import type { Source } from './run.ts'

const dir = new URL('./__fixtures__/', import.meta.url)

// Offline source for dry runs and the e2e dataset: only the saved fixture pages exist.
const ROUTES: [RegExp, string][] = [
  [/^\/tabella(\?selected_season=55&league=L1)?$/, 'standings-current-L1.html'],
  [/^\/tabella\/48343\/eredmenyek\/\d+$/, 'match-played.html'],
]

export const fixtureSource: Source = {
  async get(path) {
    const file = ROUTES.find(([re]) => re.test(path))?.[1]
    if (!file) throw new HttpError(404, path)
    return readFileSync(new URL(file, dir), 'utf8')
  },
}
