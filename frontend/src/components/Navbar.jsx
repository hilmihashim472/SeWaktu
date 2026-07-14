import { Link, NavLink } from "react-router-dom";
import PrayerIcon from "./PrayerIcon";
import { PRAYER_LABELS } from "./PrayerGrid";

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
    isActive ? "text-brass" : "text-slate-400 hover:text-slate-200"
  }`;

export default function Navbar({ clock, currentPrayer }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-night-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <img
            src="/logoSW.svg"
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
            <span className="hidden sm:inline">Prayer Times</span>
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
            <span className="hidden sm:inline">Timetable</span>
          </NavLink>
          <NavLink to="/masjid" className={navLinkClass}>
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
                d="M4 21V11.5c0-1.5.7-2.9 1.9-3.8L12 3l6.1 4.7c1.2.9 1.9 2.3 1.9 3.8V21"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 21v-6a3 3 0 0 1 6 0v6"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 21h16M12 3v2.5"
              />
            </svg>
            <span className="hidden sm:inline">Masjid</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 sm:text-sm">
          {currentPrayer && (
            <>
              <span className="flex items-center gap-1 text-emerald-400/80">
                <PrayerIcon name={currentPrayer} className="h-3.5 w-3.5" />
                <span className="font-serif tracking-wide">
                  {PRAYER_LABELS[currentPrayer]}
                </span>
              </span>
              <span className="text-slate-600">|</span>
            </>
          )}
          <span>
            {clock} <span className="text-slate-600">MYT</span>
          </span>
        </div>
      </div>
    </header>
  );
}
