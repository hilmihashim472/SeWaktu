import { NavLink } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const TABS = [
  {
    to: "/",
    end: true,
    labelKey: "nav.prayerTimes",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    to: "/timetable",
    end: false,
    labelKey: "nav.timetable",
    icon: (
      <>
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
      </>
    ),
  },
  {
    to: "/qiblat",
    end: false,
    labelKey: "nav.qiblat",
    icon: (
      <>
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
      </>
    ),
  },
  /*{
    to: "/masjid",
    end: false,
    labelKey: "nav.masjid",
    icon: (
      <>
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
      </>
    ),
  },*/
  {
    to: "/settings",
    end: false,
    labelKey: "nav.settings",
    icon: (
      <>
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
      </>
    ),
  },
];

export default function BottomNav() {
  const { t } = useLanguage();
  return (
    <nav
      aria-label="Primary"
      className="fixed left-1/2 z-20 -translate-x-1/2 sm:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-line bg-surface-panel p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8),0_0_0_1px_rgba(196,147,63,0.08)] backdrop-blur-xl">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="group flex items-center rounded-full transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            {({ isActive }) => (
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "bg-brass/20 text-accent-strong shadow-[inset_0_0_0_1px_rgba(196,147,63,0.35)]"
                    : "text-ink-400 group-hover:text-ink-200"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`h-5 w-5 shrink-0 ${isActive ? "text-accent" : ""}`}
                  aria-hidden="true"
                >
                  {tab.icon}
                </svg>
                <span
                  className={`overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-300 ${
                    isActive ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0"
                  }`}
                >
                  {t(tab.labelKey)}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
