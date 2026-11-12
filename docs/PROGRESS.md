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
