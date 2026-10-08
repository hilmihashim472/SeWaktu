# Single image: builds the React frontend and serves it from the Express backend.

# --- Frontend build ---
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Leave VITE_API_URL unset so the app calls /api on its own origin.
RUN npm run build

# --- Backend deps (compiles better-sqlite3 if no prebuilt binary matches) ---
FROM node:22-slim AS backend
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# --- Runtime ---
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/masjid.sqlite3 \
    FRONTEND_DIST=/app/public
WORKDIR /app/backend
COPY --from=backend /app/backend ./
COPY --from=frontend /app/frontend/dist /app/public
# Mount a persistent volume at /data so the masjid SQLite file survives redeploys.
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
