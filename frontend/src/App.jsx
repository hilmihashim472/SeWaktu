import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import MasjidDirectory from "./pages/MasjidDirectory";
import Timetable from "./pages/Timetable";
import usePrayerTimes from "./hooks/usePrayerTimes";
import useCountdown from "./hooks/useCountdown";
import useClock from "./hooks/useClock";

const DEFAULT_ZONE = "WLY01";
const STORAGE_KEY = "sewaktu.zone";

function GeometricStar() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 animate-spin-slow text-brass opacity-[0.06] motion-reduce:animate-none"
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
  const [zoneName, setZoneName] = useState("");
  const { data, loading, error, retry } = usePrayerTimes(zone);
  const { next, current, secondsRemaining, progress } = useCountdown(data?.timings);
  const clock = useClock();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, zone);
  }, [zone]);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#0B1F2A] via-[#132C38] to-[#1C3D4B]">
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
              setZoneName={setZoneName}
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
            <Timetable zone={zone} setZone={setZone} zoneName={zoneName} setZoneName={setZoneName} />
          }
        />
      </Routes>

      <div className="pb-24 sm:pb-0">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}
