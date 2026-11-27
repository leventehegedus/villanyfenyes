# Progress

## Phase 1: setup and discovery (done)

Scaffolded Vite + React 18 + TS + Tailwind v4 + shadcn, ESLint, Prettier, jscpd, CI, `.claude/` hooks/agents/settings, `CLAUDE.md`. Inspected the source site: no JSON API, robots allows all, ids decoded (`/tabella/{matchId}/eredmenyek/{teamId}`), fields documented in `docs/DATA_SOURCES.md`. Trimmed fixtures saved in `scripts/ingest/__fixtures__/`.


## Phase 2: ingest and data layer (done)

`scripts/ingest/`: cheerio parsers (standings, match, hall of fame), normaliser (ids, dedupe, synthetic ids for upcoming matches), gates (selection, row drop > 30 %), polite fetcher (sequential, delay, retries, budget), `run.ts` orchestration, `index.ts` CLI (`--season`, `--league`, `--dry-run`, `--fixtures`, `--out`, `--budget`, `--now`), scheduled `ingest.yml`. `src/lib/`: schemas, standings recompute + tie-break per rules, schedule, stats, scorers, filters, storage, last-seen, ics, format, data client. Fixture dataset in `e2e/fixtures/data` (generated with `pnpm ingest --fixtures --out e2e/fixtures/data --now 2026-11-12T12:00:00Z`).

## Phase 3: UI (done)

Layout (desktop nav, mobile bottom nav + menu sheet, data age, stale banner, disclaimer footer), i18n hu/en, theme, pages: standings, schedule (+ .ics), results, match sheet `/m/:id`, team `/t/:id` (computed stats, charts), scorers, stats (+ head-to-head), hall of fame, settings (diagnostics). Verified with Playwright MCP on fixture data (`DATA_DIR=e2e/fixtures/data pnpm dev`) at 390 px and 1280 px, light and dark.


## Phase 4: deploy and docs (done)

README, `vercel.json` (SPA rewrite, cache headers), Playwright smoke test (`e2e/smoke.spec.ts`, mobile + desktop, fails on console errors) wired into CI, final `docs/DATA_SOURCES.md`.

## Phase 5: final verification (done)

Clean clone: install, lint, typecheck, tests, `pnpm dup` (0 clones), build, fixture dry-run ingest and e2e all pass. Ponytail audit: 8 findings fixed (last-seen merge per league, pinned favourites, ingest commit noise, workflow input via env + rebase, empty state for seasons without data, tests for budget and writes). Opus review: 10 findings fixed (hall of fame failure no longer blocks the run, known scores never overwritten by blank pages, `seasons.json` merges leagues, empty table after data is a gate error, scoreless matches stop being refetched after 14 days, team ids stay stable across the season, gates require the selected season/league, backfills do not touch `meta.json`, match sheet closes back to where it was opened, CLI numbers validated). `rankByRules` now drives an ingest warning when the site's order differs from the rules.

Open / needs the live site: first scheduled ingest (all 19 leagues, match page formats for forfeits, team id stability across seasons). Deploy: connect the repo to Vercel and allow Actions write access (see README).

## 2026-11-13 follow-ups (done)

L1-only ingest; missing-data state; UI round: league progression chart and cross table (Statisztika tabs), form hover, complete weekly lists, centred match dialog, scorer team filter, hall of fame removed.

## 2026-11-13 team all-time page (done)

L1 backfill of all seasons (5-54; 51, 8 and 13 have no L1 table on the site). Per-team all-time page `/t/:teamId/osszes`: honours per league, totals per league, season timeline with best/worst season, goals-per-match chart, record matches, streaks across seasons, clean sheets / no-goal matches, head-to-head with favourite and bogey, all-time scorers with coverage. Team page season picker lists only the team's seasons. Data: `public/data/teams/<id>.json` from `pnpm ingest` (or `--teams-only`).

Next: enable more leagues in `src/lib/leagues.ts` when wanted (the page already handles several). Deferred: venue and kick-off time breakdowns, sortable opponents table.

## 2026-11-13 later (done)

Team page: "Összesítés" button next to the name; league table under the charts, clicking a week shows the table at the end of that week (`?w=`), same on the Statisztika progression chart. New "Örökranglista" page (`/orokranglista`): L1 titles, L1 seasons, wins and goals per team, from `public/data/leaderboard.json` (built by the ingest from the team files; `--teams-only` rebuilds it).

## 2026-11-16 ingest freshness (done)

- Removed the header "Refresh" button: it only re-fetched deployed JSON (already covered by `staleTime` + `refetchOnWindowFocus`) and suggested live results.
- GitHub drops most scheduled ingest runs (~5-6 of ~20 per day ran). Decision: an external scheduler (cron-job.org) triggers `workflow_dispatch` on `ingest.yml` every 3 h with a fine-grained token (this repo only, Actions: read and write). The GitHub crons stay as a fallback; the `ingest` concurrency group queues overlapping runs.

## 2026-11-20 odds merged into what-if (done)

Statisztika: the "Esélyek" tab is merged into "Mi lenne, ha · esélyek". The position-odds heatmap sits under the what-if calculator and simulates with the entered scores counted as played (`?w=`), so it updates as results are typed. Old `?v=odds` links open the merged tab.

## 2026-11-20 all leagues (done)

`ENABLED_LEAGUES` now lists all 19 leagues. Season 55 (2026 Ősz) ingested for all of them (898 requests, 0 pending match pages); the scheduled ingest keeps them current. Site order differs from the tie-break rules in 55/L3A, 55/L4C, 55/L5C (warning only). Next: browser check of the league picker and leaderboard with 19 leagues; optional backfill of earlier seasons for the lower leagues.

## Restyle: Sporta-inspired look (branch `design/sporta`)

Visual language taken from sporta.framer.ai: Clash Display (self-hosted woff2 in `src/assets/fonts`, Fontshare ITF Free Font License, Hungarian glyphs checked) set in caps for `font-heading`, Geist body; black/white base, `#F5F5F5`-style cards without ring, mint accent with green text, cream footer (`--cream`), `--radius: 0`; dark theme derived (near-black green, mint accent). Black sticky header with white active tab, floating dark bottom nav on mobile, larger page titles. Done on tokens and primitives only (`index.css`, `button`, `badge`, `card`, `Layout`, `PageHeader`); no page-level changes, no photography. Checked in the browser: desktop light, mobile dark. Next: review on the remaining pages, decide whether to merge.

## 2026-11-24 scorers table styling (done)

Scorers list rows use the standings colouring: gold, silver, bronze for ranks 1-3 (ties share the colour), then alternating stripes, full-row hover. Shared in `src/components/row-style.ts`. The scorer-coverage note above the list was removed (key `scorersCoverage` dropped). Checked in the browser: desktop dark, mobile light.

## 2026-11-24 podium colouring on every ranked table (branch `style/table-podium-everywhere`)

`rowProps(rank, index)` in `src/components/row-style.ts` colours rows gold/silver/bronze for ranks 1-3, then stripes. Used by the standings (also on Stats and Team pages, where highlighted teams now keep their medal colour and get a left accent bar instead of a grey fill), the what-if table, the scorers list, the leaderboard boards, the team all-time seasons table (by final position) and the team all-time scorers. Not applied to non-ranked tables (cross table, odds heatmap, opponents, league totals, player match log). Progression chart team toggles are square now. Checked: stats desktop dark, leaderboard desktop light, team all-time mobile dark.
Leaderboard: teams of the current season's L1 are set in bold (read from that league file; nothing bold if it fails), with a one-line legend under the page note.
Match lists (schedule, team page, what-if inputs, player log) are striped too (`STRIPED_LIST` / `rowProps(null, i)`). Hover/focus accent (`--accent`, `--ring`) and the odds heatmap hue (`--seq`) are yellow instead of green in both themes; win/loss colours (`--win`) stay green.
Rankings and match lists share two row colours: page background and `--stripe` (foreground 3 % light, 5 % dark, over the background); medal tints mix over the background too.

## 2026-11-24 schedule opens on today's matches (branch `feat/daily-matches`)

`/menetrend` without `l` in the URL shows every league of the selected season on one Budapest day (`DayMatches`, `?d=YYYY-MM-DD`), grouped by league: today if it has matches, else the next match day, else the last; arrows jump to the previous/next day with matches (`siteDay`, `matchDays`, `pickDay`, `stepDay` in `src/lib/schedule.ts`). The league picker there has "Minden liga" (removes `l`); choosing a league shows the usual week-grouped schedule with filters. The Menetrend nav link keeps only the season (`keepSeason`), so it always opens on every league. League files load with `useQueries` and the shared `leagueQuery` options. Checked: desktop dark (all leagues, switching to L2B), mobile light; e2e green.

## 2026-11-27 mobile bottom nav docked

The mobile bottom nav is no longer floating: it is docked to the bottom edge, full width and opaque, with safe-area padding (`viewport-fit=cover` in `index.html`; the layout root and the "more" sheet respect the insets). Checked in Chromium, iPhone 13 emulation, both themes; hidden on desktop. Not checked on a real iPhone. Fixed afterwards: every e2e smoke test failed on a 404 for `/_vercel/insights/script.js` (CI red since "feat: add Vercel Web Analytics"); the test now stubs that script.
