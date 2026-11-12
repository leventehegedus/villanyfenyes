# Progress

## Phase 1: setup and discovery (done)

Scaffolded Vite + React 18 + TS + Tailwind v4 + shadcn, ESLint, Prettier, jscpd, CI, `.claude/` hooks/agents/settings, `CLAUDE.md`. Inspected the source site: no JSON API, robots allows all, ids decoded (`/tabella/{matchId}/eredmenyek/{teamId}`), fields documented in `docs/DATA_SOURCES.md`. Trimmed fixtures saved in `scripts/ingest/__fixtures__/`.


## Phase 2: ingest and data layer (done)

`scripts/ingest/`: cheerio parsers (standings, match, hall of fame), normaliser (ids, dedupe, synthetic ids for upcoming matches), gates (selection, row drop > 30 %), polite fetcher (sequential, delay, retries, budget), `run.ts` orchestration, `index.ts` CLI (`--season`, `--league`, `--dry-run`, `--fixtures`, `--out`, `--budget`, `--now`), scheduled `ingest.yml`. `src/lib/`: schemas, standings recompute + tie-break per rules, schedule, stats, scorers, filters, storage, last-seen, ics, format, data client. Fixture dataset in `e2e/fixtures/data` (generated with `pnpm ingest --fixtures --out e2e/fixtures/data --now 2026-11-12T12:00:00Z`).

## Phase 3: UI (done)

Layout (desktop nav, mobile bottom nav + menu sheet, data age, stale banner, disclaimer footer), i18n hu/en, theme, pages: standings, schedule (+ .ics), results, match sheet `/m/:id`, team `/t/:id` (computed stats, charts), scorers, stats (+ head-to-head), hall of fame, settings (diagnostics). Verified with Playwright MCP on fixture data (`DATA_DIR=e2e/fixtures/data pnpm dev`) at 390 px and 1280 px, light and dark.

Next: phase 4 (README, vercel.json, Playwright smoke test + CI job, final DATA_SOURCES), phase 5 (final verification, ponytail audit, Opus review).
