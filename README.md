# SeWaktu - Waktu Solat Malaysia

**Malaysian Islamic prayer times, a masjid/surau directory, and monthly prayer timetables —
in one app.**

SeWaktu ("se-waktu", roughly "in time") pulls prayer times from JAKIM's official e-Solat API
(falling back to Aladhan when JAKIM is unavailable), serves a searchable directory of over
26,000 masjid and surau nationwide, and lays out full-month timetables you can export to CSV.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Data sources & attribution](#data-sources--attribution)

## Features

**Prayer times**
- Live countdown to the next prayer, with a progress ring showing how far through the current
  prayer period you are
- Zone selector covering every JAKIM zone in Malaysia, persisted across visits
- Falls back to Aladhan automatically if JAKIM's API is slow or unreachable, with the source
  and cache time surfaced in the UI

**Monthly timetable**
- Full-month prayer time tables, current month onward (no historical lookups)
- Today's row highlighted automatically when viewing the current month
- One-click CSV export of the displayed month
- Responsive: a real sticky-header table on desktop, stacked day-cards on mobile — no
  horizontal scrolling required

**Masjid & surau directory**
- Search and filter ~26,000 masjid/surau records by state, district, name, or kind
- Server-side pagination so the full dataset is never shipped to the browser
- Detail view with address, contact info, and a "Get Directions" link to Google Maps
- Kept in sync automatically with the upstream dataset via a daily scheduled job (see
  [backend/README.md](backend/README.md#how-the-sync-works))

**Everywhere**
- Dark, glassy UI with a consistent navy/brass theme across every page
- Mobile-first navigation: a floating pill dock on phones, a full nav bar on desktop
- Fully responsive down to small phone widths

## Tech stack

| | |
| --- | --- |
| **Backend** | Node.js, Express, better-sqlite3, node-cron, csv-parse |
| **Frontend** | React 19, React Router, Vite, Tailwind CSS |
| **Data sources** | [JAKIM e-Solat](https://www.e-solat.gov.my/), [Aladhan API](https://aladhan.com/), [Malaysia Masjid Dataset](https://github.com/abualif120/malaysia-masjid-dataset) |

## Project structure

```
SeWaktu/
├── backend/            Express API — see backend/README.md
│   └── src/
│       ├── routes/      prayer-times, zones, masjid, admin, timetable
│       ├── services/    JAKIM/Aladhan fetch + fallback, masjid sync, caching
│       ├── jobs/        scheduled masjid dataset sync (node-cron)
│       └── db/          SQLite connection + schema
└── frontend/           React + Tailwind app — see frontend/README.md
    └── src/
        ├── pages/       PrayerTimesPage, Timetable, MasjidDirectory
        ├── components/  shared UI, plus masjid/ and timetable/ subfolders
        └── hooks/       data-fetching hooks (usePrayerTimes, useTimetable, useMasjidSearch, ...)
```

Each half has its own detailed README:
[backend/README.md](backend/README.md) covers every route, the JAKIM → Aladhan fallback chain,
caching behavior, and the masjid data sync job. [frontend/README.md](frontend/README.md) covers
the page/component structure and environment configuration.

## Getting started

Both halves need their own install and `.env` (copied from each folder's `.env.example`), and
the backend must be running before the frontend can fetch data.

```bash
# Terminal 1 — backend, defaults to http://localhost:3000
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 — frontend, defaults to http://localhost:5173
cd frontend
cp .env.example .env
npm install
npm run dev
```

Then open `http://localhost:5173`. The masjid directory's local database starts empty until
the first sync — see [backend/README.md#manual-sync](backend/README.md#manual-sync) to trigger
one immediately instead of waiting for the daily 3am job.

## Configuration

**`backend/.env`**

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port the server listens on | `3000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `REQUEST_TIMEOUT_MS` | Timeout for outbound JAKIM/Aladhan requests | `8000` |
| `ADMIN_SYNC_TOKEN` | Shared secret for the manual masjid-sync endpoint | — |

**`frontend/.env`**

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:3000` |

## API overview

| Route | Description |
| --- | --- |
| `GET /api/prayer-times/:zone` | Today's prayer times for a JAKIM zone |
| `GET /api/timetable/:zone?month=&year=` | A full month of upcoming prayer times |
| `GET /api/zones` | Every JAKIM zone, grouped by state |
| `GET /api/masjid` | Paginated, filterable masjid/surau directory |
| `GET /api/masjid/:id` | A single masjid/surau record |
| `POST /api/admin/sync-masjid-data` | Admin-only: force a masjid dataset re-sync |
| `GET /api/health` | Health check |

Full request/response shapes, validation rules, and error formats are documented in
[backend/README.md](backend/README.md).

## Data sources & attribution

- Prayer times: [JAKIM e-Solat](https://www.e-solat.gov.my/) (primary), with
  [Aladhan](https://aladhan.com/) as an automatic fallback.
- Masjid & surau directory: JAKIM SISMIM and JAIS e-Masjid data, compiled via the
  [Malaysia Masjid Dataset](https://github.com/abualif120/malaysia-masjid-dataset)
  (CC BY 4.0).

This is an independent project and is not an official JAKIM product.
