import { useEffect, useRef, useState } from "react";
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getCompassHeading,
  getCurrentCoords,
  needsOrientationPermission,
  requestOrientationPermission,
} from "../lib/qiblat";
import { useLanguage } from "../contexts/LanguageContext";

function LocatingState() {
  return (
    <div className="flex flex-1 animate-pulse flex-col items-center justify-center gap-4 py-10">
      <div className="h-64 w-64 rounded-full border-4 border-line sm:h-72 sm:w-72" />
      <div className="h-4 w-48 rounded bg-tint-strong" />
    </div>
  );
}

function ErrorState({ code, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-12 w-12 text-accent"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.4 20.5h17.2a1.5 1.5 0 0 0 1.3-2.46L13.71 3.86a1.5 1.5 0 0 0-2.42 0z"
        />
      </svg>
      <div>
        <p className="font-serif text-lg text-ink-200">{t("qiblat.errorTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-400">{t(`errors.${code}`)}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

function CompassDial({ qiblaBearing, heading, live, aligned }) {
  const rotation = live ? -heading : 0;
  const accent = aligned ? "var(--positive)" : "var(--accent)";

  return (
    <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" strokeWidth="2" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="100"
            y1="12"
            x2="100"
            y2={deg % 90 === 0 ? "22" : "18"}
            stroke="var(--line-strong)"
            strokeWidth="2"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}

        <path
          d="M100 4 L94 20 L106 20 Z"
          fill={accent}
          style={{ transition: "fill 0.3s ease" }}
        />

        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 0.2s ease-out",
          }}
        >
          <text x="100" y="30" textAnchor="middle" fill="var(--ink-300)" className="font-mono text-[11px]">N</text>
          <text x="170" y="105" textAnchor="middle" fill="var(--ink-500)" className="font-mono text-[11px]">E</text>
          <text x="100" y="178" textAnchor="middle" fill="var(--ink-500)" className="font-mono text-[11px]">S</text>
          <text x="30" y="105" textAnchor="middle" fill="var(--ink-500)" className="font-mono text-[11px]">W</text>

          <g transform={`rotate(${qiblaBearing} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="26"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
              style={{ transition: "stroke 0.3s ease" }}
            />
            <circle cx="100" cy="22" r="7" fill={accent} style={{ transition: "fill 0.3s ease" }} />
          </g>
        </g>

        <circle cx="100" cy="100" r="4" fill="var(--ink-200)" />
      </svg>
    </div>
  );
}

const FIGURE_EIGHT_PATH =
  "M100,60 C100,20 40,20 40,60 C40,100 100,100 100,60 C100,20 160,20 160,60 C160,100 100,100 100,60 Z";

function CalibrationModal({ onClose }) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("qiblat.calibrateTitle")}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-line bg-surface-mid p-6 text-center shadow-2xl animate-fade-in-up"
      >
        <svg viewBox="0 0 200 120" className="mx-auto h-24 w-40" aria-hidden="true">
          <path
            d={FIGURE_EIGHT_PATH}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="3"
            strokeDasharray="7 7"
            strokeLinecap="round"
          />
          <circle r="8" fill="var(--accent)">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={FIGURE_EIGHT_PATH} />
          </circle>
        </svg>

        <h2 className="mt-2 font-serif text-lg text-ink-100">{t("qiblat.calibrateTitle")}</h2>
        <p className="mt-2 text-sm text-ink-400">{t("qiblat.calibrateBody")}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          {t("qiblat.calibrateGotIt")}
        </button>
      </div>
    </div>
  );
}

export default function Qiblat() {
  const { t } = useLanguage();
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("loading");
  const [geoErrorCode, setGeoErrorCode] = useState("");

  const [heading, setHeading] = useState(0);
  const [orientationAvailable, setOrientationAvailable] = useState(null);
  const [orientationPermission, setOrientationPermission] = useState("unknown");
  const [showCalibration, setShowCalibration] = useState(false);
  const calibrationAutoShownRef = useRef(false);

  function locate() {
    setGeoStatus("loading");
    getCurrentCoords()
      .then((c) => {
        setCoords({ latitude: c.latitude, longitude: c.longitude });
        setGeoStatus("granted");
      })
      .catch((err) => {
        setGeoErrorCode(err.code || "geoGeneric");
        setGeoStatus("error");
      });
  }

  useEffect(() => {
    locate();
  }, []);

  useEffect(() => {
    setOrientationPermission(needsOrientationPermission() ? "needed" : "granted");
  }, []);

  useEffect(() => {
    if (geoStatus !== "granted" || orientationPermission !== "granted") return;

    let usedAbsolute = false;

    function applyHeading(event) {
      const value = getCompassHeading(event);
      if (value !== null) {
        setHeading(value);
        setOrientationAvailable(true);
      }
    }
    function handleAbsolute(event) {
      usedAbsolute = true;
      applyHeading(event);
    }
    function handleRelative(event) {
      if (!usedAbsolute) applyHeading(event);
    }

    window.addEventListener("deviceorientationabsolute", handleAbsolute);
    window.addEventListener("deviceorientation", handleRelative);

    const fallbackTimer = setTimeout(() => {
      setOrientationAvailable((prev) => (prev === null ? false : prev));
    }, 1500);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleAbsolute);
      window.removeEventListener("deviceorientation", handleRelative);
      clearTimeout(fallbackTimer);
    };
  }, [geoStatus, orientationPermission]);

  async function handleEnableCompass() {
    try {
      await requestOrientationPermission();
      setOrientationPermission("granted");
    } catch {
      setOrientationPermission("denied");
    }
  }

  const qiblaBearing = coords ? calculateQiblaBearing(coords.latitude, coords.longitude) : null;
  const distanceKm = coords ? calculateDistanceToKaaba(coords.latitude, coords.longitude) : null;
  const live = orientationAvailable === true;
  const relativeBearing = live ? ((qiblaBearing - heading + 360) % 360) : null;
  const aligned = relativeBearing !== null && (relativeBearing <= 5 || relativeBearing >= 355);

  // Prompt for calibration once, the first time the live compass becomes
  // available on this page visit — accuracy depends on the user actually
  // moving the phone through a figure-8 to settle the magnetometer.
  useEffect(() => {
    if (live && !calibrationAutoShownRef.current) {
      calibrationAutoShownRef.current = true;
      setShowCalibration(true);
    }
  }, [live]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-serif text-3xl text-ink-100 sm:text-4xl">
          {t("qiblat.titlePrefix")} <span className="text-accent">{t("qiblat.titleAccent")}</span>
        </h1>
        <p className="mt-1 text-sm text-ink-400">{t("qiblat.subtitle")}</p>
      </div>

      {geoStatus === "loading" && <LocatingState />}
      {geoStatus === "error" && <ErrorState code={geoErrorCode} onRetry={locate} />}

      {geoStatus === "granted" && (
        <div className="flex flex-1 flex-col items-center gap-6 animate-fade-in-up">
          <CompassDial qiblaBearing={qiblaBearing} heading={heading} live={live} aligned={aligned} />

          {aligned && (
            <p className="-mt-2 text-sm font-medium text-positive">{t("qiblat.facingQibla")}</p>
          )}

          {orientationPermission === "needed" && (
            <div className="flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={handleEnableCompass}
                className="rounded-lg border border-brass/60 bg-brass/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-brass/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                {t("qiblat.enableCompass")}
              </button>
              <p className="max-w-sm text-xs text-ink-500">{t("qiblat.enableCompassBody")}</p>
            </div>
          )}

          {orientationPermission === "denied" && (
            <p className="max-w-sm text-center text-xs text-ink-500">{t("qiblat.deniedBody")}</p>
          )}

          {orientationPermission === "granted" && orientationAvailable === false && (
            <p className="max-w-sm text-center text-xs text-ink-500">{t("qiblat.unsupportedBody")}</p>
          )}

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-line bg-tint p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">{t("qiblat.bearing")}</p>
              <p className="mt-1 font-mono text-2xl text-accent-strong">{qiblaBearing.toFixed(1)}°</p>
            </div>
            <div className="rounded-xl border border-line bg-tint p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400">{t("qiblat.distance")}</p>
              <p className="mt-1 font-mono text-2xl text-accent-strong">
                {Math.round(distanceKm).toLocaleString()} km
              </p>
            </div>
          </div>

          {live && (
            <button
              type="button"
              onClick={() => setShowCalibration(true)}
              className="text-sm text-accent-strong underline decoration-brass/40 underline-offset-2 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              {t("qiblat.recalibrate")}
            </button>
          )}
        </div>
      )}

      {showCalibration && <CalibrationModal onClose={() => setShowCalibration(false)} />}
    </div>
  );
}
