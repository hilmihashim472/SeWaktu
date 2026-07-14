# SeWaktu Frontend

Vite + React frontend for Malaysian Islamic prayer times ("Waktu Solat").

## Backend required

This app has no data of its own — it fetches everything from the SeWaktu Express backend
(`../backend`). **Start the backend first**, then run this app. By default it expects the
backend at `http://localhost:3000`; override with `VITE_API_URL` (see `.env.example`).

Endpoints used:

- `GET {VITE_API_URL}/api/zones`
- `GET {VITE_API_URL}/api/prayer-times/:zone`

If the backend isn't running, the app shows a friendly error with a retry button instead of
crashing.

## Configuration

```bash
cp .env.example .env
# edit VITE_API_URL if your backend runs somewhere other than localhost:3000
```

## Running

```bash
npm install
npm run dev      # starts the dev server (default http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Notes

- Selected zone is persisted to `localStorage` (defaults to `WLY01` — Kuala Lumpur/Putrajaya).
- The countdown to the next prayer is computed against the `Asia/Kuala_Lumpur` timezone
  regardless of the visitor's local timezone.
- Respects `prefers-reduced-motion` for the rotating background decoration.
