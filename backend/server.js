import "dotenv/config";
import app from "./src/app.js";
import db from "./src/db/database.js";
import pool from "./src/db/postgres.js";
import { startMasjidSyncSchedule } from "./src/jobs/syncSchedule.js";

const PORT = process.env.PORT || 4000;
const SHUTDOWN_TIMEOUT_MS = 10000;

if (process.env.NODE_ENV === "production") {
  for (const key of ["DATABASE_URL", "ADMIN_SYNC_TOKEN", "SITE_URL"]) {
    if (!process.env[key]) console.warn(`[config] ${key} is not set — see backend/.env.example.`);
  }
}

const server = app.listen(PORT, () => {
  console.log(`SeWaktu backend listening on http://localhost:${PORT}`);
  startMasjidSyncSchedule();
});

// Must outlast the reverse proxy's idle timeout, or the proxy can reuse a
// connection Node has just closed and the user gets a random 502.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Coolify sends SIGTERM on redeploy/stop: finish in-flight requests, then
// close the databases cleanly so the SQLite WAL is checkpointed.
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received, closing server...`);

  const forceExit = setTimeout(() => {
    console.error("[shutdown] timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async () => {
    try {
      await pool.end();
      db.close();
    } catch (error) {
      console.error(`[shutdown] error while closing databases: ${error.message}`);
    }
    console.log("[shutdown] done");
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
  // State is unknown after an uncaught exception — log it and let Docker restart us.
  console.error("[process] uncaught exception:", error);
  process.exit(1);
});
