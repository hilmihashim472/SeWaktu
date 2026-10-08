import { Router } from "express";
import db from "../db/database.js";
import pool from "../db/postgres.js";

const router = Router();
const POSTGRES_CHECK_TIMEOUT_MS = 3000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function checkSqlite() {
  try {
    db.prepare("SELECT 1").get();
    return { status: "ok" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

async function checkPostgres() {
  if (!process.env.DATABASE_URL) return { status: "not_configured" };
  try {
    await withTimeout(pool.query("SELECT 1"), POSTGRES_CHECK_TIMEOUT_MS);
    return { status: "ok" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// Liveness — used by the Docker/Coolify healthcheck. Only checks things a
// container restart could fix (the process and its local SQLite file), so a
// Supabase outage doesn't put the container into a restart loop.
router.get("/", (req, res) => {
  const sqlite = checkSqlite();
  const healthy = sqlite.status === "ok";
  res
    .status(healthy ? 200 : 503)
    .set("Cache-Control", "no-store")
    .json({ status: healthy ? "ok" : "error", uptime: Math.round(process.uptime()), checks: { sqlite } });
});

// Readiness/diagnostics — also checks Postgres. Use this for uptime monitoring
// (e.g. Uptime Kuma) when you want to know about Supabase problems too.
router.get("/ready", async (req, res) => {
  const sqlite = checkSqlite();
  const postgres = await checkPostgres();
  const healthy = sqlite.status === "ok" && postgres.status !== "error";
  res
    .status(healthy ? 200 : 503)
    .set("Cache-Control", "no-store")
    .json({
      status: healthy ? "ok" : "degraded",
      uptime: Math.round(process.uptime()),
      checks: { sqlite, postgres },
    });
});

export default router;
