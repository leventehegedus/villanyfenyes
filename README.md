# Villanyfényes bajnokság viewer (unofficial)

A fast, mobile-first, read-only viewer for the [Villanyfényes bajnokság](https://villanyfenyesbajnoksag.hu), an amateur football league in Budapest. It shows standings, the fixture schedule, results, match details, team statistics, top scorers, the hall of fame and your favourite teams. The UI is Hungarian by default, with English as an option.

This project is **not affiliated with the league**. The data comes from the league's public pages and may be delayed or contain errors. The official site is authoritative.

## How the data flows

```
villanyfenyesbajnoksag.hu (public HTML)
  └─ scheduled GitHub Action (every 30 min in the evening, every 3 h otherwise): pnpm ingest
       fetch (polite, sequential, budgeted) → parse (cheerio) → normalise → validate (Zod) → sanity gates
       └─ public/data/*.json committed only when the data changed
            └─ static host redeploys (Vercel)
                 └─ the SPA reads same-origin JSON via TanStack Query
```

- There is no backend, database, account or API key. Preferences and favourites live in `localStorage`.
- `public/data/` holds `meta.json`, `seasons.json`, `hall-of-fame.json` and `{seasonId}/{league}.json`.
- If any gate fails (wrong page served, missing selector, row counts dropping more than 30 %, schema errors), the ingest writes nothing and exits non-zero, so the workflow fails visibly and the previous data stays.
- Standings always come from the site's own table. Statistics computed from results are labelled as computed. Missing data is shown as missing.

Details of what the site publishes, the id scheme and the parsing assumptions are in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## Quickstart

Requires Node 22+ and pnpm.

```sh
pnpm install
DATA_DIR=e2e/fixtures/data pnpm dev   # run on the small fixture dataset
pnpm dev                              # run on public/data (empty until the first ingest)
```

| Command | What it does |
|---|---|
| `pnpm build` / `pnpm preview` | production build / serve it |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm dup` | checks (Vitest, jscpd copy-paste gate at 3 %) |
| `pnpm e2e` | Playwright smoke test on the build with fixture data (no live calls) |
| `pnpm ingest` | fetch the current season into `public/data` (only leagues in `src/lib/leagues.ts`, currently L1) |
| `pnpm ingest --season 52` | backfill one past season (rate-limited, same budget) |
| `pnpm ingest --dry-run` | fetch, parse and gate, write nothing |
| `pnpm ingest --fixtures --dry-run` | offline run on the saved HTML fixtures |

Ingest options: `--league L1` (repeatable), `--budget 200` (max requests per run), `--delay 1500` (ms between requests), `--out <dir>`, `--now <iso>`.

## Deploy and schedule

1. Import the repo in Vercel (framework: Vite; `vercel.json` sets the build, SPA rewrites and cache headers). Every push redeploys.
2. In GitHub, allow Actions to write to the repo (Settings → Actions → Workflow permissions → read and write). `.github/workflows/ingest.yml` then runs every 30 minutes from 18:00 to 24:00 Budapest time, every 3 hours otherwise, and on manual dispatch (optional season id, request budget, dry run).
3. Match pages are cached: the first run fills the standings for all leagues and as many match pages as the budget allows; later runs fetch only new or recently changed matches. Filling a whole season takes a few runs.

## Limitations

- The site publishes no round numbers, referees or kick-off lengths. Lists are grouped by week; calendar events have a start time only.
- Scores and scorers come from per-match pages, which the ingest fetches gradually; the scorer list states how many matches it covers.
- Hall of fame data is shown as published (2025 onwards per the site) and is not mixed into season scorer lists.
- The HTML can change without notice. When it does, the gates stop the ingest and the parser tests show what moved.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS v4, shadcn/ui (Radix), TanStack Query, React Router, Zod, Recharts, cheerio (ingest only), Vitest, Playwright.
