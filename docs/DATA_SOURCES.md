# Data sources

All data comes from the public pages of <https://villanyfenyesbajnoksag.hu> (server-rendered Laravel behind Cloudflare). Findings below come from the phase 1 inspection on 2026-11-12. Re-check them when the ingest starts failing.

## Access and terms

- `robots.txt`: `User-agent: *` / `Disallow:` (empty), so all paths are allowed.
- ÁSZF (`/oldalak/1`) holds only placeholder lorem ipsum text. Nothing forbids automated reading.
- No JSON API exists. The season/league selector is a plain `GET` form to `/tabella`. The only XHR is Google Analytics. Responses send `cache-control: no-cache, private` and no `ETag`/`Last-Modified` for HTML pages, so conditional requests are not possible.

## Pages used

| Page | URL | What we take |
|---|---|---|
| Standings | `/tabella?selected_season={seasonId}&league={code}` | season list, league list, standings rows, row icons, per-team fixture cards, team card summary |
| Match result | `/tabella/{matchId}/eredmenyek/{teamId}` | season label, venue, kickoff, final score, goals per player (only players with goals > 0) |
| Hall of fame | `/hiressegek-csarnoka` | six top-3 tables |
| Rules | `/oldalak/3` (Versenykiírás) | tie-break rules (read once, implemented in code) |

Not used: `/` (only truncated names), `/hirek/*`, `/blog`, `/versenykiirasok`, login/registration, anything behind authentication.

## Ids

- **Match result URL** `/tabella/{A}/eredmenyek/{B}`: `A` is the **match id** (the same `A` appears on both teams' cards), `B` is the **team id** of the card owner (it differs per team: Lokomotív MFC = 69, Gyermekláncfűrész = 100 for match 48343). The page renders the same match for either team id.
- **Season id**: the `selected_season` option value. Not chronological (2025 Tavasz = 5, 2026 Ősz = 55).
- **League code**: `L1`, `L2A`-`L2B`, `L3A`-`L3D`, `L4A`-`L4D`, `L5A`-`L5H`.
- Teams have no id in the standings row. The ingest takes the team id from the team's own result links. A team without any result link gets a synthetic id `x-{slug}` (stable per name).
- Upcoming matches have no link and therefore no site id. The ingest gives them a synthetic id `x-{seasonId}-{league}-{kickoff}-{homeSlug}-{awaySlug}`. When the match gets a result link, the site id replaces it.

## Fields the site provides

Standings row: position, team name, `MSZ`, `Gy`, `D`, `V`, `LG`, `KG`, `GK` (signed, e.g. `+24`), `Pont`, icons:

| Icon file | Meaning (site legend) |
|---|---|
| `check.png` | Feljutás (promotion) |
| `xmark.png` | Kiesés (relegation) |
| `fire.png` | won 2 matches in a row |
| `ice.png` | lost 2 matches in a row |
| `ball.png` | Sok gól (many goals) |
| `goalkeeper.png` | Kevés gól (few goals conceded) |

Team card (`extraRow{n}`): fixture cards (`Home - Away`, venue such as `Bogdánfy_1`, kickoff `YYYY-MM-DD HH:MM:SS` Budapest local time, result link only when the site has a result page), and a summary: "Legjobb liga", "Legtöbb gólt szerző játékos" (`Name (goals)`, scope not stated by the site), "Szezonok száma", "Lejátszott mérkőzések száma". Older seasons may leave summary fields empty.

Match page: home team = team 1, away team = team 2 (matches the card order), league, season label, `venue - kickoff`, final score `h : a`, per-team list of rostered players with goals. Players with `0` goals are roster members, not scorers: the ingest drops them. Team captain names are shown but not collected.

Hall of fame: six tables with an `h4` title; column headers are wrong on some tables (player tables say "Csapat", the player seasons table says "Első szezon"). The ingest maps each table by its `h4` title, not the header. Data covers 2025 onwards only.

## Not provided

- Rounds (forduló) are not published. The app groups by week/date instead.
- Referees: not published.
- Home/away has no real meaning (all matches at the same venue), but the order is published and kept.
- Postponed status is not published. A past match without a score is shown as "no result".

## Known quirks

- A result link can exist before a result is recorded (seen: 8 links, `MSZ` 7). The match page decides whether a score exists.
- One season (2005 - Ősz) has a `1970-01-01` date range.
- The default league for a season is `L1`.

## Parsing assumptions (update when the HTML changes)

- Standings rows are `.tabella-box > .tabella-row` after the header row; each row is followed by its `.extraRow{n}` sibling.
- Team name: the last `div` child of `.teamName`.
- Numeric columns: `.tabella-col` with a first `div` label (`MSZ`, ...) and a second `div` value.
- Match page score: `.sportsmagazine-overview-score > span` as `h <small>:</small> a`.
