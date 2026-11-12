# Decisions

- **Data strategy: build-time ingest** (option 2). No public JSON API, no export, robots.txt allows everything, ÁSZF is a placeholder. The ingest fetches HTML with Node, parses it with cheerio, validates with Zod and writes static JSON to `public/data/`.
- **React Router 7, not 8.** React Router 8 requires React 19; the stack is fixed to React 18.
- **TypeScript 5.9.** TypeScript 7 exists but typescript-eslint supports `<6.1`.
- **shadcn/ui v4 (radix-nova preset, Tailwind v4).** `Button` is wrapped in `forwardRef` because React 18 does not pass `ref` as a prop and Radix `asChild` triggers need it.
- **Ids**: site match id and team id from the result URL (see DATA_SOURCES.md); synthetic `x-` ids for upcoming matches and teams without links.
- **All-or-nothing writes**: if any sanity gate fails, the ingest writes nothing and exits non-zero.
- **Match pages are cached**: a match with a score whose kickoff is older than 7 days is not fetched again. A per-run request budget limits new fetches; the first full season fill takes several scheduled runs.
- **Rounds**: not published by the site; schedule groups by ISO week.
- **Chrome DevTools MCP was not installed**; network inspection used Playwright MCP instead.
- **Frontend skills** (`vercel-react-best-practices`, `typescript-advanced-types`, `frontend-design`) were not installed; their rules are applied from the build prompt text.

- **No rounds**: lists group by Budapest week (Monday start).
- **Home/away split not shown**: every match is at the same venue, so the published order has no home advantage meaning.
- **Ponytail audit**: run once at the end (phase 5) instead of after every phase, to save tokens; phases 1-3 got a manual review.
- **UI written in the main session** rather than by parallel subagents: all pages share the i18n dictionary, layout and hooks, so parallel edits would conflict.
- **Sheet overlay patched with forwardRef** (same React 18 reason as Button).
- **DATA_DIR**: a tiny Vite plugin serves `/data/*` from another folder in dev/preview, so dev and e2e use fixture data without touching `public/data`.

## Opus usage

(none yet)
