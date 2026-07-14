import { Router } from "express";
import { zoneCodes } from "../data/zones.js";
import { fetchMonthlyTimings } from "../services/prayerTimeService.js";

const router = Router();
const MAX_MONTHS_AHEAD = 12;

function getKLYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  return {
    year: Number(parts.find((p) => p.type === "year").value),
    month: Number(parts.find((p) => p.type === "month").value),
  };
}

router.get("/:zone", async (req, res) => {
  const zone = req.params.zone.toUpperCase();

  if (!zoneCodes.has(zone)) {
    return res.status(400).json({
      error: "InvalidZone",
      message: `Unknown JAKIM zone code "${zone}". See GET /api/zones for valid codes.`,
    });
  }

  const { year: currentYear, month: currentMonth } = getKLYearMonth();
  const month = req.query.month ? Number.parseInt(req.query.month, 10) : currentMonth;
  const year = req.query.year ? Number.parseInt(req.query.year, 10) : currentYear;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({
      error: "InvalidMonth",
      message: "Query param 'month' must be an integer between 1 and 12.",
    });
  }
  if (!Number.isInteger(year) || year < 1) {
    return res.status(400).json({ error: "InvalidYear", message: "Query param 'year' must be a valid integer." });
  }

  const requestedIndex = year * 12 + (month - 1);
  const currentIndex = currentYear * 12 + (currentMonth - 1);

  if (requestedIndex < currentIndex) {
    return res.status(400).json({
      error: "PastMonth",
      message:
        `This endpoint is upcoming-only — ${String(month).padStart(2, "0")}/${year} is in the past. ` +
        `Try month=${currentMonth}&year=${currentYear} or later.`,
    });
  }
  if (requestedIndex > currentIndex + MAX_MONTHS_AHEAD) {
    return res.status(400).json({
      error: "TooFarAhead",
      message: `Requests are limited to ${MAX_MONTHS_AHEAD} months ahead of the current month.`,
    });
  }

  try {
    const result = await fetchMonthlyTimings(zone, month, year);
    res.json(result);
  } catch (error) {
    res.status(502).json({
      error: "UpstreamUnavailable",
      message: `Unable to retrieve the ${String(month).padStart(2, "0")}/${year} timetable for zone "${zone}" from JAKIM or Aladhan.`,
      detail: error.message,
    });
  }
});

export default router;
