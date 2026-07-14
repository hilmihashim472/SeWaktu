import { useEffect, useState } from "react";

const PRAYER_ORDER = ["imsak", "fajr", "syuruk", "dhuhr", "asr", "maghrib", "isha"];
const SECONDS_PER_DAY = 86400;

function nowSecondsInKualaLumpur() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return (get("hour") % 24) * 3600 + get("minute") * 60 + get("second");
}

function toSecondsOfDay(hhmm) {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 3600 + minute * 60;
}

const INITIAL_STATE = { next: null, current: null, secondsRemaining: 0, progress: 0 };

/** Given today's `timings` ({ imsak, fajr, ... }), ticks every second and
 * returns which prayer is next, which period is currently active, how many
 * seconds remain until `next`, and `progress` (0-1) through the current
 * period — all measured against wall-clock time in Asia/Kuala_Lumpur. */
export default function useCountdown(timings) {
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    if (!timings) {
      setState(INITIAL_STATE);
      return undefined;
    }

    const entries = PRAYER_ORDER.filter((key) => timings[key]).map((key) => ({
      key,
      seconds: toSecondsOfDay(timings[key]),
    }));

    const tick = () => {
      if (entries.length === 0) {
        setState(INITIAL_STATE);
        return;
      }

      const nowSeconds = nowSecondsInKualaLumpur();
      const upcomingIndex = entries.findIndex((entry) => entry.seconds > nowSeconds);
      const nextIndex = upcomingIndex === -1 ? 0 : upcomingIndex;
      const currentIndex = (nextIndex - 1 + entries.length) % entries.length;

      const next = entries[nextIndex];
      const current = entries[currentIndex];
      const secondsRemaining =
        upcomingIndex === -1 ? next.seconds - nowSeconds + SECONDS_PER_DAY : next.seconds - nowSeconds;

      const periodLength =
        ((next.seconds - current.seconds) % SECONDS_PER_DAY + SECONDS_PER_DAY) % SECONDS_PER_DAY ||
        SECONDS_PER_DAY;
      const elapsed = periodLength - secondsRemaining;
      const progress = Math.min(1, Math.max(0, elapsed / periodLength));

      setState({ next: next.key, current: current.key, secondsRemaining, progress });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timings]);

  return state;
}
