import { Router } from "express";
import zones from "../data/zones.js";
import { findNearestZone } from "../data/zoneCoordinates.js";

const router = Router();

// { "Selangor": [{ code: "SGR01", districts: "..." }, ...], ... }
const zonesByState = Object.fromEntries(zones.map((state) => [state.state, state.zones]));
const districtsByCode = new Map(zones.flatMap((state) => state.zones.map((z) => [z.code, z.districts])));

router.get("/", (req, res) => {
  res.json(zonesByState);
});

router.get("/nearest", (req, res) => {
  const lat = Number.parseFloat(req.query.lat);
  const lng = Number.parseFloat(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      error: "InvalidCoordinates",
      message: "Query params 'lat' and 'lng' must be valid coordinates (lat: -90..90, lng: -180..180).",
    });
  }

  const result = findNearestZone(lat, lng);
  res.json({ ...result, districts: districtsByCode.get(result.zone) ?? null });
});

export default router;
