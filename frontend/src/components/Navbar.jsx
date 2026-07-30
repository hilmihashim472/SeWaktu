import { Link, NavLink } from "react-router-dom";
import PrayerIcon from "./PrayerIcon";
import { PRAYER_LABELS } from "./PrayerGrid";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
    isActive ? "text-accent" : "text-ink-400 hover:text-ink-200"
  }`;

export default function Navbar({ clock, currentPrayer }) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface-header backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <img
            src={resolvedTheme === "dark" ? "/logoSW.svg" : "/logoSW-light.svg"}
            alt="SeWaktu — Waktu Solat Malaysia"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex sm:gap-2">
          <NavLink to="/" end className={navLinkClass}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7v5l3 2"
              />
              <circle
                cx="12"
                cy="12"
                r="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{t("nav.prayerTimes")}</span>
          </NavLink>
          <NavLink to="/timetable" className={navLinkClass}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="4.5"
                width="18"
                height="16"
                rx="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.5h18M8 2.5v4M16 2.5v4"
              />
            </svg>
            <span className="hidden sm:inline">{t("nav.timetable")}</span>
          </NavLink>
          <NavLink to="/qiblat" className={navLinkClass}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.5 8.5l-2.2 5.5-5.5 2.2 2.2-5.5 5.5-2.2z"
              />
            </svg>
            <span className="hidden sm:inline">{t("nav.qiblat")}</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
            <span className="hidden sm:inline">{t("nav.settings")}</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 font-mono text-xs text-ink-400 sm:text-sm">
          {currentPrayer && (
            <>
              <span className="flex items-center gap-1 text-positive">
                <PrayerIcon name={currentPrayer} className="h-3.5 w-3.5" />
                <span className="font-serif tracking-wide">
                  {PRAYER_LABELS[currentPrayer]}
                </span>
              </span>
              <span className="text-ink-600">|</span>
            </>
          )}
          <span>
            {clock} <span className="text-ink-600">MYT</span>
          </span>
        </div>
      </div>
    </header>
  );
}
