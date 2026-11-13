# Team All-Time Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A per-team all-time page (`/t/:teamId/osszes`) built from one precomputed file per team, and a team-page season picker that lists only the team's seasons.

**Architecture:** The ingest reads every league file on disk, calls pure functions in `src/lib/alltime.ts` to build one `TeamAllTimeFile` per team, validates and writes `public/data/teams/<teamId>.json`. The browser loads one team file through TanStack Query; small pure helpers in the same module derive the displayed numbers (league totals, honours, best/worst season, opponent highlights).

**Tech Stack:** TypeScript 5.9 strict, Zod 4, React 18, TanStack Query 5, React Router 7, Tailwind v4 + shadcn/ui, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-team-alltime-design.md`

## Global Constraints

- No `any`, no `as unknown as T`, no non-null `!`; components small with typed props; no fetch in `useEffect`.
- Computation only in `src/lib/` (pure, tested); `scripts/ingest/` only reads/writes files and calls it; schemas in `src/lib/schema.ts`.
- Never fabricate: missing shows `t('noData')` ("nincs adat"); derived numbers carry the existing "computed from results" label.
- Points 3/1/0 from results. Positions and promotion/relegation markers from the site's standings.
- Current season (`seasons.json` `currentSeasonId`) is `finished: false`: counted in totals, records, streaks, opponents, scorers; excluded from honours and best/worst season.
- Honours per league. Favourite/bogey need ≥ 3 matches against that opponent.
- UI strings in `src/i18n/dict.ts`, hu and en. Code/comments/commits in English.
- Definition of done: `pnpm typecheck && pnpm lint && pnpm test && pnpm dup` pass; browser check mobile + desktop, both themes.
- `public/data/` is only written by `pnpm ingest`; never hand-edit.

## Review Focus

1. A team that played in only one season (no streak across seasons, no best/worst distinction) — page renders, best and worst may be the same season and are shown once.
2. A team whose only season is the current one — honours show 0 / best-worst show `noData`, nothing crashes.
3. Matches without scorer data (`scorers === null`) mixed with fetched ones — scorer section shows coverage "x / y matches", never treats missing as 0 goals.
4. Team id in the URL with no team file (404) — team page picker falls back to the full list; all-time page shows `teamNotFound`.
5. Same team name under several ids across seasons — ingest prints a warning listing them (the spec's id-stability check).

---

### Task 1: Schema and per-team builder

**Files:**
- Modify: `src/lib/schema.ts`
- Create: `src/lib/alltime.ts`, `src/lib/alltime.test.ts`
- Use fixtures helper `src/lib/__fixtures__/league.ts` (`match(...)`, `leagueFixture`)

**Interfaces:**
- Produces in `schema.ts`:
  - `MatchRef = { seasonId: number; league: string; matchId: string; kickoff: string | null; opponentId: string; goalsFor: number; goalsAgainst: number }`
  - `AllTimeTotals = { played, won, drawn, lost, goalsFor, goalsAgainst, points }` (non-negative ints)
  - `TeamAllTimeFile = { schemaVersion; teamId; names: string[] /* latest first, ≥1 */; seasons: { seasonId; label; league; finished: boolean; position: number | null; teamsInLeague: number; marker: 'promotion' | 'relegation' | null; totals: AllTimeTotals }[] /* newest first */; opponents: { teamId; name; totals: AllTimeTotals }[]; records: { biggestWin: MatchRef | null; biggestDefeat: MatchRef | null; highestScoring: MatchRef | null }; streaks: { win: Streak | null; unbeaten: Streak | null; loss: Streak | null }; cleanSheets: number; failedToScore: number; scorers: { playedMatches: number; coveredMatches: number; rows: { name: string; goals: number; matches: number; hatTricks: number }[] } }` with `Streak = { length: number; from: MatchRef; to: MatchRef }`; plus `TeamAllTimeFileRead` (tolerant arrays, same pattern as `LeagueFileRead`) and exported types.
- Produces in `alltime.ts`:
  - `type SeasonLeague = { seasonId: number; league: string; file: LeagueFile }`
  - `buildAllTime(inputs: readonly SeasonLeague[], seasons: SeasonsFile): Map<string, TeamAllTimeFile>`
  - `duplicateNames(inputs: readonly SeasonLeague[]): { name: string; ids: string[] }[]`

- [ ] **Step 1: Write failing tests** in `alltime.test.ts`, inputs built from `match()` over two seasons (ids 10 older, 11 current) for team `a`:
  - `totals per season and newest-first order`: `file.seasons.map(s => s.seasonId)` equals `[11, 10]`; season 10 totals equal hand-counted W/D/L/goals/points.
  - `marks the current season unfinished`: season 11 `finished === false`, season 10 `true`.
  - `takes position and marker from standings`: position from `StandingRow.position`; `markers` containing `'promotion'` gives `marker: 'promotion'`; other markers give `null`; team missing from standings gives `position: null`.
  - `streak spans seasons`: last two wins of season 10 + first win of 11 → `streaks.win.length === 3`, `from.seasonId === 10`, `to.seasonId === 11`; matches with `kickoff: null` are skipped.
  - `records and clean sheets`: biggest win/defeat/highest scoring match refs carry `seasonId` and `league`; `cleanSheets` and `failedToScore` counts.
  - `opponents use latest name`: opponent renamed in season 11 → `name` is the season 11 name.
  - `scorer coverage`: one match `scorers: null`, one with `[{name:'X', goals:3}]` → `coveredMatches 1`, `playedMatches 2`, row `X` `hatTricks 1`.
  - `renamed team lists all names`: `names` equals `['New', 'Old']`.
  - `duplicateNames` returns `[{ name: 'Same', ids: ['1', '2'] }]` when one name has two ids.
- [ ] **Step 2: Run** `pnpm vitest run src/lib/alltime.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement** schema additions and `buildAllTime` / `duplicateNames`. Order seasons by `Season.start` (fallback: order in `seasons.seasons`, which is newest first). Reuse `teamResults` (`src/lib/stats.ts`) per input file and tag each result with `seasonId`/`league`; reuse the existing outcome/points logic rather than re-deriving it.
- [ ] **Step 4: Run** the test — PASS. Then `pnpm typecheck`.
- [ ] **Step 5: Commit** `feat(lib): build per-team all-time summaries`.

### Task 2: Display helpers

**Files:**
- Modify: `src/lib/alltime.ts`, `src/lib/alltime.test.ts`

**Interfaces:**
- Consumes: `TeamAllTimeFile` (Task 1).
- Produces:
  - `leagueTotals(file): { league: string; seasons: number; totals: AllTimeTotals }[]` plus `overall(file): AllTimeTotals`
  - `rates(t: AllTimeTotals): { winPct: number | null; pointsPerMatch: number | null; goalDiff: number }`
  - `honours(file): { league: string; titles: number; podiums: number; promotions: number; relegations: number }[]` (finished seasons only)
  - `bestWorstSeason(file): { best: number | null; worst: number | null }` (season ids; finished only; ties: better position, then more recent)
  - `opponentHighlights(file, minMatches = 3): { mostPlayed: string | null; favourite: string | null; bogey: string | null }` (opponent team ids)
  - `goalsPerSeason(file): { seasonId: number; label: string; forPerMatch: number | null; againstPerMatch: number | null }[]` oldest first

- [ ] **Step 1: Failing tests**, one per helper, including: `honours` ignores an unfinished season with position 1; `bestWorstSeason` returns `{best: null, worst: null}` when only the current season exists; `opponentHighlights` ignores an opponent met twice; `rates` of zero played gives `winPct: null, pointsPerMatch: null`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** the six helpers.
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(lib): all-time display helpers`.

### Task 3: Ingest writes team files

**Files:**
- Create: `scripts/ingest/alltime-step.ts`, `scripts/ingest/alltime-step.test.ts`
- Modify: `scripts/ingest/index.ts` (after the season files are written / in dry run after the gate)

**Interfaces:**
- Consumes: `buildAllTime`, `duplicateNames` (Task 1); `readJson`, `writeIfChanged` (`scripts/ingest/write.ts`).
- Produces: `teamFiles(out: string, produced: ReadonlyMap<string, LeagueFile>, seasons: SeasonsFile): { files: Map<string, TeamAllTimeFile>; warnings: string[]; errors: string[] }` — `produced` keys are `"<seasonId>/<league>.json"` from this run and override files read from `out`; returned keys are `"teams/<teamId>.json"`. Reads only directories matching `/^\d+$/`. Strict-schema failure → `errors`. Each duplicate name → warning `team name "<name>" has several ids: 1, 2`.

- [ ] **Step 1: Failing tests** on a temp dir (`mkdtempSync`): writes files for every team; a file in `produced` overrides the disk copy; a schema-invalid input yields an error and no files; duplicate name yields the warning.
- [ ] **Step 2: Run** `pnpm vitest run scripts/ingest/alltime-step.test.ts` — FAIL.
- [ ] **Step 3: Implement** `teamFiles`; in `index.ts` call it with `result.files` and the seasons file this run produced (or the previous one), print warnings like the existing ones, treat errors like gate failures (exit 1, nothing written), write with `writeIfChanged` unless `--dry-run`, and add changed team files to the `changed:` line.
- [ ] **Step 4: Run** tests — PASS. Then `pnpm ingest --dry-run` and read only its summary/warning lines: report the duplicate-name warnings to the owner before continuing (spec risk).
- [ ] **Step 5: Regenerate e2e data** with `pnpm ingest --fixtures --out e2e/fixtures/data` so `e2e/fixtures/data/teams/` exists.
- [ ] **Step 6: Commit** `feat(ingest): write per-team all-time files`.

### Task 4: Team file query and filtered picker

**Files:**
- Modify: `src/lib/data.ts`, `src/hooks/queries.ts`, `src/components/SeasonLeaguePicker.tsx`, `src/pages/TeamPage.tsx`

**Interfaces:**
- Produces: `fetchTeam(teamId: string, f?: Fetcher)` in `data.ts` (reads `teams/<teamId>.json` with `TeamAllTimeFileRead`, same `fetchJson` path); `useTeamAllTime(teamId: string | undefined)` in `queries.ts` (`staleTime` 10 min); `SeasonLeaguePicker` gains optional prop `only?: { seasonId: number; league: string }[]`.

- [ ] **Step 1: Failing test** in `src/lib/data.test.ts`: `fetchTeam` builds the `teams/<id>.json` URL and parses a minimal valid file.
- [ ] **Step 2: Run** — FAIL; **Step 3: implement**; **Step 4: run** — PASS.
- [ ] **Step 5:** `SeasonLeaguePicker` filters season options and league options by `only` when given. `TeamPage` passes `only` from the team file's `seasons`; when the URL season is not in it, call `setSelection({ s, l })` with the newest entry (replace). If the team query errors (404), pass nothing (full list). Add a link to `/t/:teamId/osszes` in the team header (`t('allTime')`).
- [ ] **Step 6:** `pnpm typecheck && pnpm lint && pnpm test`. Commit `feat(team): season picker lists only the team's seasons`.

### Task 5: All-time page

**Files:**
- Create: `src/pages/TeamAllTimePage.tsx` (thin: sections as small components in the same file only if each stays under ~60 lines, otherwise `src/components/alltime/*.tsx`)
- Modify: `src/App.tsx` (route `t/:teamId/osszes` before `t/:teamId`), `src/i18n/dict.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `useTeamAllTime` (Task 4), helpers (Task 2), existing `Stat`, `Card`, `Table`, `PageHeader` (`picker={false}`), chart pattern from `src/components/TeamCharts.tsx`, `formatDecimal`.

- [ ] **Step 1:** Add e2e smoke step: open `/t/<a fixture teamId>/osszes`, expect the team name heading and the totals table.
- [ ] **Step 2:** Run `pnpm e2e` — FAIL.
- [ ] **Step 3:** Build sections in spec order: header (names, first/last season), honours tiles per league, league totals table + total row (win %, pts/match), timeline (season label, league, position / teamsInLeague, marker, "in progress" for unfinished, best/worst badges), goals-per-match chart, records (links `m/<matchId>?s=<seasonId>&l=<league>`), streaks with dates, clean sheets / failed to score, opponents table (sortable via `sortRows`) with three highlight tiles, scorer table with coverage line. Missing → `t('noData')`. Add hu + en strings.
- [ ] **Step 4:** `pnpm e2e` — PASS; `pnpm typecheck && pnpm lint && pnpm test && pnpm dup` — PASS.
- [ ] **Step 5:** Browser check (Playwright MCP) on `pnpm dev`: mobile 390px and desktop, light and dark; team with many seasons and team with one season.
- [ ] **Step 6:** Commit `feat(team): all-time page`.

### Task 6: Data, docs, handoff

- [ ] **Step 1:** Wait until the season backfill loop has finished (it commits and pushes per season; parallel git and file writes would collide). Then run `pnpm ingest` (current season) to generate `public/data/teams/` from all backfilled seasons; commit `chore(data): team all-time files`.
- [ ] **Step 2:** Update `docs/PROGRESS.md` (done, next, open decisions) and add the id-stability finding to `docs/DECISIONS.md`. Commit and push.
