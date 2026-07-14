# SeWaktu

Malaysian Islamic prayer times ("Waktu Solat"), a masjid/surau directory, and a monthly prayer
timetable — sourced from JAKIM e-Solat and Aladhan, with a JAIS-detailed masjid dataset.

- **`backend/`** — Express.js API. See [backend/README.md](backend/README.md) for routes,
  the JAKIM → Aladhan fallback chain, caching, and the masjid data sync job.
- **`frontend/`** — Vite + React + Tailwind app. See [frontend/README.md](frontend/README.md)
  for the page structure and configuration.

## Running locally

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

The masjid directory's local database starts empty until the first sync — see
[backend/README.md#manual-sync](backend/README.md#manual-sync) for how to trigger one.
