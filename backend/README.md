# SeWaktu Backend

Express.js API that serves Malaysian Islamic prayer times ("Waktu Solat") by JAKIM zone.

## Routes

- `GET /api/prayer-times/:zone` — today's normalized prayer times for a JAKIM zone code (e.g. `WLY01`).
- `GET /api/zones` — the full JAKIM zone list, grouped by state.
- `GET /api/health` — health check, returns `{ "status": "ok" }`.
- `GET /api/masjid` — paginated masjid/surau directory. See [Masjid directory](#masjid-directory).
- `GET /api/masjid/states` — distinct `state` values with row counts, for filter UIs.
- `GET /api/masjid/districts?state=X` — distinct `district` values (+ counts) within a state.
- `GET /api/masjid/:id` — a single masjid/surau record.
- `POST /api/admin/sync-masjid-data` — admin-only, forces a re-sync. See [Manual sync](#manual-sync).
- `GET /api/timetable/:zone` — a full month of upcoming prayer times. See [Monthly timetable](#monthly-timetable).

## Data source chain

For each request, `src/services/prayerTimeService.js` resolves prayer times in this order:

1. **JAKIM e-Solat API** (primary) — called server-to-server, so no CORS restriction applies:
   `GET https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone={ZONE}&period=today`
2. **Aladhan API** (fallback) — used automatically if JAKIM times out, returns a non-200 status,
   or responds with an unexpected shape:
   `GET https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={lat}&longitude={lng}&method=17`
   Coordinates come from `src/data/zoneCoordinates.js`, which maps each JAKIM zone to an
   approximate lat/lng (defaulting to Kuala Lumpur if a zone isn't mapped). `method=17` selects
   JAKIM's own calculation method so fallback results stay consistent with the primary source.

Both shapes are normalized to the same response before being sent to the client:

```json
{
  "source": "jakim",
  "zone": "WLY01",
  "date": "14-Jul-2026",
  "day": "Tuesday",
  "hijri": "1447-01-29",
  "timings": {
    "imsak": "05:52",
    "fajr": "06:02",
    "syuruk": "07:15",
    "dhuhr": "13:19",
    "asr": "16:43",
    "maghrib": "19:20",
    "isha": "20:33"
  },
  "cachedAt": "2026-07-14T00:03:00+08:00"
}
```

`source` is `"jakim"` or `"aladhan-fallback"` depending on which upstream produced the data.

If **both** upstreams fail, the route responds `502 Bad Request` with a JSON error body instead
of crashing the server:

```json
{
  "error": "UpstreamUnavailable",
  "message": "Unable to retrieve prayer times for zone \"WLY01\" from JAKIM or Aladhan.",
  "detail": "..."
}
```

## Caching

Prayer times only change once a day, so `src/services/cacheService.js` keeps a simple in-memory
`Map` keyed by `${zone}-${date}`, where `date` is today's date in the `Asia/Kuala_Lumpur` timezone
(`YYYY-MM-DD`). Every request first checks this cache; only a miss triggers a call to JAKIM/Aladhan.
Because the key includes the Kuala Lumpur calendar date, the cache "invalidates" automatically at
midnight local time — the next request simply produces a new key and repopulates the cache. There
is no background timer or manual eviction.

## Monthly timetable

`GET /api/timetable/:zone?month=7&year=2026` returns a full month of prayer times as an array of
day objects. It's **upcoming-only by design** — `month`/`year` default to the current Kuala Lumpur
calendar month, and requesting anything already fully in the past returns `400 PastMonth`.
Requests more than 12 months ahead return `400 TooFarAhead`, since neither upstream reliably has
data that far out. An unknown zone code returns `400 InvalidZone`, and an out-of-range `month`
(outside 1–12) or non-integer `year` returns `400 InvalidMonth`/`400 InvalidYear`.

```json
{
  "zone": "WLY01",
  "month": 7,
  "year": 2026,
  "source": "jakim",
  "days": [
    {
      "date": "15-Jul-2026",
      "day": "Wednesday",
      "hijri": "1447-01-30",
      "timings": {
        "imsak": "05:52", "fajr": "06:02", "syuruk": "07:15", "dhuhr": "13:19",
        "asr": "16:43", "maghrib": "19:20", "isha": "20:33"
      }
    }
  ]
}
```

**The JAKIM `period=month` quirk:** JAKIM's `period=month` endpoint always returns the *current*
month server-side, ignoring any date you'd otherwise pass — there's no way to ask it for a
specific future month. So `fetchMonthlyTimings()` in `src/services/prayerTimeService.js` only
calls JAKIM when the requested month **is** the current one (with the same JAKIM → Aladhan
fallback as the daily endpoint if that call fails). Any other requested month skips JAKIM
entirely and goes straight to Aladhan's calendar endpoint
(`GET https://api.aladhan.com/v1/calendar/{year}/{month}?latitude={lat}&longitude={lng}&method=17`),
which does support arbitrary months.

**Caching:** a given zone/month/year's timings never change once published, so
`getCachedMonth`/`setCachedMonth` (in `src/services/cacheService.js`, a separate `Map` from the
daily cache) cache the whole response indefinitely — for the entire month, not just "today" —
until the process restarts.

## Masjid directory

`GET /api/masjid` and `GET /api/masjid/:id` serve a local SQLite copy of the
[abualif120/malaysia-masjid-dataset](https://github.com/abualif120/malaysia-masjid-dataset)
(masjid + surau records scraped from JAKIM SISMIM, plus richer JAIS detail for Selangor),
licensed **CC BY 4.0**.

`GET /api/masjid` query params:

| Param | Description |
| --- | --- |
| `state` | Exact match on state name (e.g. `Selangor`) |
| `district` | Exact match on district name |
| `kind` | `masjid` or `surau` |
| `q` | Case-insensitive substring match on name |
| `page` | Page number, default `1` |
| `limit` | Rows per page, default `50`, max `200` |

Response shape:

```json
{
  "data": [{ "id": 1, "name": "MASJID NEGARA", "kind": "masjid", "state": "Kuala Lumpur (FT)", ... }],
  "pagination": { "page": 1, "limit": 50, "total": 26396, "totalPages": 528 }
}
```

### How the sync works

`src/services/masjidSyncService.js` keeps the local `masjid` table in sync with the dataset's
`data/` folder without any formal versioning — the dataset has none, so freshness is detected
purely by watching the latest GitHub commit SHA that touched that folder:

1. `checkForUpdates()` calls the GitHub commits API for `data/` and compares the newest SHA
   against the `last_commit_sha` value stored in the local `dataset_meta` table. The very first
   run has no stored SHA, so it always counts as "has update".
2. If there's an update, `syncDataset()` downloads `masjid.csv`, `surau.csv`, and
   `selangor_detail.csv` from `raw.githubusercontent.com`, parses them, and normalizes all three
   into the shared `masjid` table shape (`masjid.csv`/`surau.csv` → `source: "sismim"`,
   `selangor_detail.csv` → `source: "jais"`, with the extra `category`/`email`/`website`/
   `capacity`/`latitude`/`longitude` fields it uniquely provides — note most JAIS
   latitude/longitude values are empty, per the upstream dataset's own documented limitation).
3. Downloading and parsing happen **before** any database write. Only once everything parses
   cleanly does it open a transaction that deletes the existing rows, bulk-inserts the new ones,
   and updates `dataset_meta`. If anything fails at any point — download, parse, or insert — the
   transaction rolls back (or never starts) and the previously synced data is left untouched.

### Schedule

A `node-cron` job (`src/jobs/syncSchedule.js`) runs `checkForUpdates()` once daily at **3am
Asia/Kuala_Lumpur** and only calls `syncDataset()` if an update is found. Every run — including
no-op checks — logs a timestamped line, so the audit trail lives in the server logs. This is
started automatically when `server.js` boots.

GitHub's unauthenticated API rate limit is 60 requests/hour; this job calls it once a day, and
every call logs the `X-RateLimit-Remaining` response header for visibility.

### Manual sync

```bash
curl -X POST http://localhost:3000/api/admin/sync-masjid-data \
  -H "X-Admin-Token: $ADMIN_SYNC_TOKEN"
```

Forces an immediate re-sync (regardless of whether `checkForUpdates()` would report a change) and
returns the sync summary as JSON — useful right after a deploy or for testing. Requires the
`X-Admin-Token` header to match the `ADMIN_SYNC_TOKEN` env var; requests without it (or with the
wrong value) get `401`, and the route itself returns `503` if the server has no token configured.

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port the server listens on | `3000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `REQUEST_TIMEOUT_MS` | Timeout for outbound JAKIM/Aladhan requests | `8000` |
| `ADMIN_SYNC_TOKEN` | Shared secret required in `X-Admin-Token` to call the manual sync route | none — route returns `503` until set |

## Running

```bash
npm install

# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:<PORT>` (default `3000`). The masjid dataset starts empty
until the first successful sync — either wait for the 3am cron run or trigger one manually (see
above). The SQLite file lives at `src/db/masjid.sqlite3` and is gitignored; it's rebuilt from
scratch on first sync.
