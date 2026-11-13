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

- **Only L1 is fetched (2026-11-13, owner's request).** `src/lib/leagues.ts` is the allowlist: the ingest skips other leagues from the site's list, refuses `--league` for them, and `seasons.json` lists only enabled leagues. The schedule runs every 30 min 18:00-24:00 Budapest and every 3 h otherwise; one L1 run is ~2 requests plus new match pages.

- **2026-11-13 UI round (owner's requests):** hall of fame removed (page, parser, schema, fixture, data file); match details open in a centred dialog; results list every kicked-off match (scores pending show "awaiting result"), schedule shows all matches and jumps to the current week; scorer list has a team filter; form chips show the match on hover/focus and link to it.
- **League progression chart:** 12 coloured lines are unreadable, so all teams draw muted and up to 4 highlighted teams (URL `h`, default favourites else the top 3) use the validated categorical slots 1-4 (dataviz reference palette, light and dark steps) with legend chips and direct end labels. Points are computed from stored results and labelled so.
- **Cross table:** standings order, row team's view, cells link to the match; tinted by outcome with the score as text.

- **2026-11-13 second UI round (owner's requests):** one schedule page instead of schedule + results; multi-select team filter (`?t=69,100`); every favourites feature and the last-seen notice removed; calendar export removed; form column on the standings table; match dialog shows only teams, score, kickoff and one scorer list split left/right; comparison tab (and its head-to-head logic) removed.
- **Medal colours on the progression chart (owner's choice):** the top 3 are gold/silver/bronze. The validator flags silver (grey, low chroma) and aqua vs silver (normal-vision ΔE 14.2); mitigations: every highlighted line has a direct end label (medals with their position), non-podium highlights are dashed. Since 2026-11-13 any number of teams can be highlighted (owner's request): non-podium teams take `--series-1..9` in selection order (reference categorical hues without yellow, plus teal and plum); with more than ~7 lines identity relies on the end labels and tooltip, not colour. `?h=-` means "nothing highlighted". Tied teams' end labels stack 13 px apart.
- **Tooltips:** `disableHoverableContent` so moving the pointer sideways between form chips switches the tooltip immediately.

- **Position odds (2026-11-13, owner's request):** `src/lib/projection.ts`. Reachable range = certain bounds from points only (teams already above the team's maximum stay above; teams whose maximum is below its current points stay below; ties not assumed). Odds = 5000 seeded Monte Carlo runs: every match without a stored score (including "awaiting result") gets Poisson goals from attack/defence rates shrunk toward the league average (3 pseudo-matches), no home advantage (single venue); each run is ranked with `rankByRules` (points, head-to-head mini-table, goal difference, goals). Shown as a one-hue heatmap on the Statisztika "Esélyek" tab; positions outside the bounds are blank, possible-but-unseen positions show a dot.
- **Form tooltip** shows the match as listed (home first, real score), without the win/draw/loss word; the outcome stays in the chip letter and the screen-reader label.

- **What-if calculator and player page (2026-11-13; the top scorer race chart was added and removed the same day at the owner's request):** what-if scores live in `?w=<matchId>:<h>-<a>,...` and only fill matches without a stored score; the table is ranked with `rankByRules`. Players have no site id, so the player page is `/j/:teamId/:name`. The league chart is drawn by `RaceChart` (function `dataKey`, so ids never act as property paths). Every match hover reads "Home h:a Away" via `matchLabel`. Points axes step by 3; clickable elements get a pointer cursor globally.

## Opus usage

- The main session ran on Opus 5.5 (session model chosen by the user); the build prompt's `opusplan` routing was not available here.
- One Opus subagent: the final review before the last commit (allowed use 2). The project agents in `.claude/agents/` were created mid-session and only load in a new session, so a `general-purpose` agent with `model: opus` was used.

## Team all-time page (2026-11-13)

- **Per-team files built by the ingest** (`public/data/teams/<teamId>.json`), not aggregated in the browser: with all leagues enabled a browser-side aggregate would need up to ~900 league files per page view. Computation lives in `src/lib/alltime.ts`; `scripts/ingest/alltime-step.ts` only reads files and calls it. Spec: `docs/superpowers/specs/2026-11-13-team-alltime-design.md`.
- **`pnpm ingest --teams-only`** rebuilds the team files from the league files on disk without any request.
- **Team id stability**: a dry run over the backfilled L1 seasons found no team name under more than one id; the ingest now warns if that ever happens.
- **Current season** counts in totals, records, streaks, opponents and scorers, but not in honours or best/worst season. Honours are per league. Favourite/bogey need at least 3 meetings.
- Implemented inline by the main session (owner left the method to me) instead of the `builder` subagent: the tasks shared one set of types closely.
- **Opus reviewer** (allowed use 2): one final whole-branch review of `feat/team-alltime` before merge.
