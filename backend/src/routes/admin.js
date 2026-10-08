import crypto from "node:crypto";
import { Router } from "express";
import { syncDataset } from "../services/masjidSyncService.js";

const router = Router();

// Constant-time comparison so the token can't be guessed byte-by-byte from response timing.
function tokensMatch(provided, expected) {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function requireAdminToken(req, res, next) {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  if (!expected) {
    return res
      .status(503)
      .json({ error: "NotConfigured", message: "ADMIN_SYNC_TOKEN is not configured on the server." });
  }

  const provided = req.header("X-Admin-Token");
  if (!provided || !tokensMatch(provided, expected)) {
    return res.status(401).json({ error: "Unauthorized", message: "Missing or invalid X-Admin-Token header." });
  }

  next();
}

router.post("/sync-masjid-data", requireAdminToken, async (req, res) => {
  try {
    const summary = await syncDataset();
    res.json(summary);
  } catch (error) {
    res.status(502).json({ error: "SyncFailed", message: error.message });
  }
});

export default router;
