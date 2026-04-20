# Sidan Melker App — Agent Context

This is a Terminal UI client for the Sidan forum (chalmerslosers.com), built with the Melker framework.

## Development

Always use these flags when testing/debugging (never launch the interactive TUI):

```bash
melker --stdout sidan.melker          # Render static snapshot to stdout
melker --ai-context sidan.melker      # Output AI accessibility context (what elements are visible and their state)
melker --print-tree sidan.melker      # Print element tree structure and exit
melker --lint --stdout sidan.melker   # Enable lint validation while rendering
```

- Use `--stdout` to verify layout and catch runtime errors without a TTY
- Use `--ai-context` to understand the rendered UI state as structured text
- Use `--print-tree` to verify element structure after edits
- Use `--lint` to catch structural/schema issues early
- `--stdout-timeout <ms>` controls how long to wait before capturing output (default 500ms); increase if data loads slowly

### Interactive testing via WebSocket server

For tasks that require interaction (switching tabs, triggering reload, typing, assessing dynamic state), use the headless server + `melker-interact.ts`:

**The user must start this once and keep it running:**
```bash
melker --headless --server --server-port 9877 --server-token devtoken --server-allow-input sidan.melker
```

**Then the agent can interact using `melker-interact.ts`:**
```bash
deno run --allow-net melker-interact.ts snapshot          # Get full document tree
deno run --allow-net melker-interact.ts inject-key Tab    # Press Tab
deno run --allow-net melker-interact.ts inject-key ctrl+r # Reload (Ctrl+R)
deno run --allow-net melker-interact.ts click <x> <y>     # Click at coordinates
deno run --allow-net melker-interact.ts dispatch <name>   # Fire a named event
deno run --allow-net melker-interact.ts engine-state      # Get engine state
```

**Tab button IDs:** `main-tabs-tab-0` (Sidan), `main-tabs-tab-1` (Medlemmar), `main-tabs-tab-2` (Arrangemang), `main-tabs-tab-3` (Blaskan)

**Typical workflow:**
1. Ask user to start the headless server (command above)
2. Use `snapshot` to read current state
3. Use `inject-key` / `click` to navigate or trigger actions
4. Edit `sidan.melker`
5. Use `inject-key ctrl+r` to reload, then `snapshot` to assess the result

## Melker Framework

Use the `melker` skill when building or modifying the app. Key rules:
- Apps are written in `.melker` files with XML-like syntax
- Scripts use TypeScript, exported functions are called via `$app.fn()`
- Use `$melker.getElementById(id)` to access elements
- Use `.getValue()` / `.setValue()` for input/textarea content, `.props.*` for other props
- Dialogs: `.show()` / `.hide()`
- Auto-render after event handlers; call `$melker.render()` for intermediate states
- `flex: 1` fills remaining space; `overflow: scroll` needs constrained size
- See the melker skill for full component and API reference

## API

**Base URL:** `https://api.chalmerslosers.com`

**Auth:** JWT Bearer token (8h expiry). Token is stored in `~/.config/sidan/config.json` and managed by the `sidan-auth` CLI. Refresh via `sidan-auth token refresh`.

### Entries (`/db/entries`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/db/entries` | No | List entries. Query: `skip`, `take`, `q` (RSQL filter e.g. `sig==foo`) |
| POST | `/db/entries` | Yes | Create entry. Body: `{ sig, msg, place?, lat?, lon?, olsug?, status? }` |
| GET | `/db/entries/{id}` | No | Get entry by ID |
| PUT | `/db/entries/{id}` | Yes (modify:entry) | Update entry |
| DELETE | `/db/entries/{id}` | Yes (modify:entry) | Delete entry |
| POST | `/db/entries/{id}/like` | Yes | Like an entry (204 no content) |

**Entry schema:**
```
id, date, time, datetime, msg (required), sig (required), email, place,
status (0=plain,1=politik,2=#27,3=#44,4=#31vs#45,5=nsfw),
olsug, enheter, lat, lon, likes, report, secret, personal_secret, sidekicks
```

### Members (`/db/members`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/db/members` | No (limited) / read:member (full) | List members. Query: `onlyValid` |
| POST | `/db/members` | Yes (write:member) | Create member |
| GET | `/db/members/{id}` | No (limited) / read:member (full) | Get member |
| PUT | `/db/members/{id}` | Yes (write:member) | Update member |
| DELETE | `/db/members/{id}` | Yes (write:member) | Delete member |

**Member schema:**
```
id, number (required), name, email, im, phone, address, address_url,
title, history, picture, is_valid
```

### Events / Arrangemang (`/db/arr`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/db/arr` | No | List events. Query: `skip`, `take` |
| POST | `/db/arr` | Yes (write:arr) | Create event |
| GET | `/db/arr/{id}` | No | Get event |
| PUT | `/db/arr/{id}` | Yes (write:arr) | Update event |
| DELETE | `/db/arr/{id}` | Yes (write:arr) | Delete event |

**Arr schema:**
```
id, namn, start_date, plats, organisator, deltagare, kanske, hetsade, losen, fularr
```

### Articles / Blaskan (`/db/articles`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/db/articles` | No | List articles. Query: `skip`, `take` |
| POST | `/db/articles` | Yes (write:article) | Create article |
| GET | `/db/articles/{id}` | No | Get article |
| PUT | `/db/articles/{id}` | Yes (write:article) | Update article |
| DELETE | `/db/articles/{id}` | Yes (write:article) | Delete article |

**Article schema:**
```
id, header, body, date, time, datetime
```

### Prospects (`/db/prospects`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/db/prospects` | No (lite) / read:member (full) | List prospects/suspects. Query: `status` (P or S) |
| POST | `/db/prospects` | Yes (write:member) | Create prospect/suspect |
| GET | `/db/prospects/{id}` | No (lite) / read:member (full) | Get prospect |
| PUT | `/db/prospects/{id}` | Yes (write:member) | Update prospect |
| DELETE | `/db/prospects/{id}` | Yes (write:member) | Delete prospect |

**Prospect schema:** `id, status (P/S), number, name, email, phone, history`

### Files (`/file`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/file/image` | Yes (write:image) | Upload image (gif/png/jpeg). Returns `{ filename }` |
| GET | `/file/{filename}` | No | Get static file |

Images are served from `https://chalmerslosers.com/` — relative URLs in entry HTML should be resolved against this base.

### Auth

**Web flow:** `GET /auth/web/login?provider=google` → callback → `{ access_token, refresh_token }`

**Device flow:**
1. `POST /auth/device/start` `{ provider }` → `{ session_id, user_code, verification_url, browser_url, interval, expires_in }`
2. `POST /auth/device/poll` `{ session_id }` → 202 (pending) or 200 `{ access_token, refresh_token }`
3. `POST /auth/device/refresh` `{ refresh_token, provider }` → new tokens

**Token response schema:** `access_token, refresh_token, token_type, expires_in, member { number, email, name }, scopes`

## Config File

Stored at `~/.config/sidan/config.json`. Fields used by the app:
- `access_token` — JWT for API calls
- `refresh_token` — for token renewal
- `expires_at` — expiry timestamp
- `member_number` — logged-in member number
- `email` — member email

## App Structure (`sidan.melker`)

- **Sidan tab** — paginated entry feed rendered as markdown, with like/map links
- **Medlemmar tab** — member list as data-table, click to view detail dialog
- **Arrangemang tab** — events as data-table, click to view detail dialog
- **Blaskan tab** — articles as data-table, click to view detail dialog
- **Dialogs:** map, article detail, member detail, event detail, new entry, auth
- **Global shortcuts:** Ctrl+R (refresh), Ctrl+N (new entry), Ctrl+L (login), Ctrl+Q (quit)

## Network Policy

Allowed hosts: `api.chalmerslosers.com`, `chalmerslosers.com`
Allowed commands: `sidan-auth`, `open`, `xdg-open`
Config read: `~/.config/sidan`
