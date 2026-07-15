import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import MasjidDirectory from "./pages/MasjidDirectory";
import Timetable from "./pages/Timetable";
import Qiblat from "./pages/Qiblat";
import Settings from "./pages/Settings";
import usePrayerTimes from "./hooks/usePrayerTimes";
import useCountdown from "./hooks/useCountdown";
import useClock from "./hooks/useClock";
import useZoneName from "./hooks/useZoneName";
import useNotificationPreference from "./hooks/useNotificationPreference";
import { detectNearestZone } from "./lib/nearestZone";
import { PRAYER_LABELS } from "./components/PrayerGrid";
import { useLanguage } from "./contexts/LanguageContext";

const DEFAULT_ZONE = "WLY01";
const STORAGE_KEY = "sewaktu.zone";

function GeometricStar() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 animate-spin-slow text-accent opacity-[0.06] motion-reduce:animate-none"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g stroke="currentColor" strokeWidth="0.4" fill="none">
          <rect x="15" y="15" width="70" height="70" />
          <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
        </g>
      </svg>
    </div>
  );
}

export default function App() {
  const [zone, setZone] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_ZONE);
  const zoneName = useZoneName(zone);
  const { data, loading, error, retry } = usePrayerTimes(zone);
  const { next, current, secondsRemaining, progress } = useCountdown(data?.timings);
  const clock = useClock();
  const notifications = useNotificationPreference();
  const { t } = useLanguage();
  const { pathname } = useLocation();

  // Jump back to the top whenever the user navigates to a different page
  // (nav bar / bottom nav tab). Keyed on pathname only, so in-page updates
  // like Timetable's month/date filters or Masjid's pagination — which only
  // change the query string — don't reset scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, zone);
  }, [zone]);

  // First-ever visit only (no stored zone yet): try to auto-select the nearest
  // zone from the browser's geolocation, silently keeping the default otherwise.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    detectNearestZone()
      .then(({ zone: detectedZone }) => setZone(detectedZone))
      .catch(() => {});
  }, []);

  // Fires a browser notification the moment `current` flips to a new prayer
  // period. The ref starts unset so the notification never fires for
  // whichever period is already active on first load — only real transitions.
  const previousPrayerRef = useRef(null);
  useEffect(() => {
    if (!current) return;
    const previous = previousPrayerRef.current;
    previousPrayerRef.current = current;

    if (
      previous &&
      previous !== current &&
      notifications.enabled &&
      notifications.permission === "granted" &&
      typeof Notification !== "undefined"
    ) {
      new Notification("SeWaktu", {
        body: t("notifications.body", { prayer: PRAYER_LABELS[current] }),
        icon: "/iconSW.svg",
      });
    }
  }, [current, notifications.enabled, notifications.permission, t]);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[var(--bg-from)] via-[var(--bg-via)] to-[var(--bg-to)]">
      <GeometricStar />

      <Navbar clock={clock} currentPrayer={current} />

      <Routes>
        <Route
          path="/"
          element={
            <PrayerTimesPage
              zone={zone}
              setZone={setZone}
              zoneName={zoneName}
              data={data}
              loading={loading}
              error={error}
              retry={retry}
              next={next}
              current={current}
              secondsRemaining={secondsRemaining}
              progress={progress}
            />
          }
        />
        <Route path="/masjid" element={<MasjidDirectory />} />
        <Route path="/masjid/:id" element={<MasjidDirectory />} />
        <Route
          path="/timetable"
          element={
            <Timetable zone={zone} setZone={setZone} zoneName={zoneName} />
          }
        />
        <Route path="/qiblat" element={<Qiblat />} />
        <Route path="/settings" element={<Settings notifications={notifications} />} />
      </Routes>

      <div className="pb-24 sm:pb-0">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}
