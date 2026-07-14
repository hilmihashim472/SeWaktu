import { Router } from "express";
import zones from "../data/zones.js";

const router = Router();

// { "Selangor": [{ code: "SGR01", districts: "..." }, ...], ... }
const zonesByState = Object.fromEntries(zones.map((state) => [state.state, state.zones]));

router.get("/", (req, res) => {
  res.json(zonesByState);
});

export default router;
