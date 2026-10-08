# Build stage: compiles better-sqlite3's native addon if no prebuilt binary matches.
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/masjid.sqlite3
WORKDIR /app
COPY --from=build /app /app
# Mount a persistent volume here so the masjid SQLite file survives redeploys.
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
