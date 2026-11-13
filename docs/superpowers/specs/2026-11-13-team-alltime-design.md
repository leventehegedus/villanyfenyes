# Team all-time page: design

Date: 2026-11-13. Status: draft, awaiting owner approval.

## Intent

Every team gets an all-time page that sums up its whole history across all ingested seasons and leagues: where it played, how it did, its records, its opponents and its scorers. Today the team page (`/t/:teamId`) only shows the selected season. The backfill of all L1 seasons (ids 5-54) makes a history view possible; more leagues will be enabled later, so the page must work for any number of leagues from day one.

Second, smaller request: on team pages the season picker lists only seasons in which that team played.

## Goals

The owner picked these stats (numbers from the brainstorm):

1. **Totals per league and overall**: matches, won, drawn, lost, goals for, goals against, goal difference, points, win %, points per match.
2. **Season timeline**: one row per season with league, final position (from the site's table), promotion/relegation marker.
3. **Honours**: league titles, podiums (top 3), promotions, relegations.
4. **Best and worst season** by points per match (ties: better position, then more recent).
5. **Record matches**: biggest win, biggest defeat, highest-scoring match; each links to the match.
6. **Longest streaks across seasons**: wins, unbeaten (W or D), losses; with first and last match date.
7. **Clean sheets** and **matches without scoring** (counts).
8. **Head-to-head per opponent**: played, W/D/L, goals, points per match; highlighted: most played opponent, "favourite" (best points per match) and "bogey" (worst).
9. **All-time scorer list** for the team: goals, matches scored in, hat-tricks (3+ goals in one match); plus the number of distinct scorers.
12. **Goals per match by season**: chart of goals for and against per match, one point per season.

## Non-goals

- Pitch/venue and kick-off time breakdowns (ideas 10, 11), deferred.
- A league-wide all-time table or a player all-time page across teams.
- Merging teams that the site lists under different ids (see Constraints).

## Anti-goals

- No fabricated numbers: a stat that cannot be computed shows "nincs adat", never 0.
- No live requests from the browser and no page that downloads every season file.
- The all-time computation must never block or corrupt the normal season ingest.

## Constraints

- Project rules (CLAUDE.md): computation is pure code in `src/lib/` with tests; the ingest only parses and calls it; shared Zod schemas live in `src/lib/schema.ts`; `public/data/` is generated, never hand-edited; UI strings via `src/i18n` (hu, en); TanStack Query only.
- Team identity = the team id the ingest already writes (`Team.id`, the site's numeric team id, or `x-<slug>` when the site has none). Not yet verified that the site keeps the same id for a team across seasons; the plan's first step checks this on the backfilled files and reports how many teams change id. If a team was renamed, the page lists every name it used.
- Points are computed from results with 3/1/0 and labelled "computed from results". Positions and promotion/relegation markers come from the site's standings.
- The current season is unfinished: it is shown in the timeline as "in progress" and counted in totals, records, streaks, opponents and scorers, but not in honours (3) or best/worst season (4).
- Scorers exist only for matches whose detail page was fetched (`Match.scorers !== null`). The scorer section states how many of the team's played matches have scorer data; if none, it shows "nincs adat".

## Approaches

- **A. Browser downloads every season file and aggregates.** No ingest change, but with all leagues enabled this is up to ~900 files per page view. Rejected.
- **B. Ingest precomputes one file per team** (`public/data/teams/<teamId>.json`) using pure functions from `src/lib/`. One small download per page; scales with leagues. **Picked by the owner.**
- **C. Ingest writes a team-to-seasons index; the browser loads only that team's season files.** Fewer generated files, but 30-40 full league files per page for an old team. Rejected.

## Design (decided)

### Data

- New schema in `src/lib/schema.ts`: `TeamAllTimeFile` (strict for writing, tolerant for reading, like `LeagueFile`/`LeagueFileRead`). It holds the precomputed results for goals 1-9 and 12, the team's names, the list of `(seasonId, league)` it played in, and a name lookup for every opponent id it references (latest name the site used).
- New pure module `src/lib/alltime.ts`: input is every `(seasonId, league, LeagueFile)` plus `SeasonsFile`; output is a `TeamAllTimeFile` per team. Reuses `teamResults`/`teamStats` (`src/lib/stats.ts`), `computeTotals` (`src/lib/standings.ts`) and `aggregateScorers` (`src/lib/scorers.ts`) where they fit, rather than duplicating them.
- Ingest: after the season files are produced, read every league file under `public/data/<season>/` from disk (overlaid with the files this run just produced), compute all team files, validate them with the strict schema and write the changed ones with the existing `writeIfChanged`. Runs on normal and `--season` backfill runs; `--dry-run` computes and validates but writes nothing. A validation failure is a gate error, like a failed season file.
- No network requests are added; this step reads only local files.

### UI

- New route `/t/:teamId/osszes` (all-time page), linked from the team page header, and back.
- Sections, top to bottom: header (current name, former names, first and last season), honours tiles (3), totals table by league plus a total row (1), season timeline (2) with best/worst season marked (4), goals-per-match chart (12), records (5), streaks (6), clean sheets / no-goal matches (7), opponents table with the three highlights (8), scorer table (9).
- Match links in records and streaks open the existing match dialog with that match's season and league in the URL.
- Season picker on team pages (`/t/:teamId`): options are only the seasons in the team's file; the league list only the team's leagues in that season. If the URL's season is not one of them, the page switches (URL replace) to the team's most recent season. The all-time page hides the season picker.
- Every derived number carries the existing "computed from results" label; missing data shows "nincs adat".

### Tests and checks

- `src/lib/alltime.test.ts` on small fixtures: totals, honours with an unfinished season, streaks spanning two seasons, opponent highlights, scorer coverage with missing match pages, renamed team.
- Ingest test: team files are written, unchanged files untouched, dry run writes nothing.
- E2E fixture data (`e2e/fixtures/data`) gets team files generated by the ingest; the smoke test opens one all-time page.
- Definition of done from CLAUDE.md, including browser check on mobile and desktop in both themes.

## Calls made while writing (owner may correct)

- Honours are counted per league (first place in `L2A` is a group win, not a championship) and shown per league in the honours tiles.
- Streak order: seasons in chronological order (by season start), matches by kick-off within a season; matches without a kick-off are left out of streaks.
- If a team file is missing (e.g. a team that appeared after the last ingest), the team page picker falls back to the unfiltered season list and the all-time link shows "nincs adat".
- Team files for the already backfilled seasons appear on the first ingest run after this ships; no separate backfill is needed because the step reads local files only.

## Left to the builder

- Picking the season ids for the team-id stability check.
- Exact field names and nesting inside `TeamAllTimeFile`.
- Minimum matches for the favourite/bogey highlight (suggested: 3, so one lucky match does not count).
- Chart library usage: follow the existing charts (`TeamCharts`, `LeagueProgressionChart`).
- Layout details and responsive behaviour within the existing design system.
