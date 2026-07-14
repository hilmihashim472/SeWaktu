import { Router } from "express";
import db from "../db/database.js";

const router = Router();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

router.get("/", (req, res) => {
  const { state, district, kind, q } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = {};

  if (state) {
    conditions.push("state = @state");
    params.state = state;
  }
  if (district) {
    conditions.push("district = @district");
    params.district = district;
  }
  if (kind) {
    conditions.push("kind = @kind");
    params.kind = kind;
  }
  if (q) {
    conditions.push("name LIKE @q");
    params.q = `%${q}%`;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM masjid ${whereClause}`).get(params);
  const rows = db
    .prepare(`SELECT * FROM masjid ${whereClause} ORDER BY name ASC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

router.get("/states", (req, res) => {
  const rows = db
    .prepare(
      `SELECT state, COUNT(*) AS count FROM masjid
       WHERE state IS NOT NULL AND state != ''
       GROUP BY state ORDER BY state ASC`
    )
    .all();
  res.json(rows);
});

router.get("/districts", (req, res) => {
  const { state } = req.query;
  if (!state) {
    return res.status(400).json({ error: "MissingState", message: "Query param 'state' is required." });
  }

  const rows = db
    .prepare(
      `SELECT district, COUNT(*) AS count FROM masjid
       WHERE state = @state AND district IS NOT NULL AND district != ''
       GROUP BY district ORDER BY district ASC`
    )
    .all({ state });
  res.json(rows);
});

router.get("/:id", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "InvalidId", message: "id must be an integer." });
  }

  const row = db.prepare("SELECT * FROM masjid WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ error: "NotFound", message: `No masjid/surau found with id ${id}.` });
  }

  res.json(row);
});

export default router;
