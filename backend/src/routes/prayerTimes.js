import { Router } from "express";
import { zoneCodes } from "../data/zones.js";
import { getPrayerTimesForZone } from "../services/prayerTimeService.js";

const router = Router();

router.get("/:zone", async (req, res) => {
  const zone = req.params.zone.toUpperCase();

  if (!zoneCodes.has(zone)) {
    return res.status(400).json({
      error: "InvalidZone",
      message: `Unknown JAKIM zone code "${zone}". See GET /api/zones for valid codes.`,
    });
  }

  try {
    const result = await getPrayerTimesForZone(zone);
    res.json(result);
  } catch (error) {
    res.status(502).json({
      error: "UpstreamUnavailable",
      message: `Unable to retrieve prayer times for zone "${zone}" from JAKIM or Aladhan.`,
      detail: error.message,
    });
  }
});

export default router;
