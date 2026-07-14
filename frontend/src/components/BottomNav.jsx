import { NavLink } from "react-router-dom";

const TABS = [
  {
    to: "/masjid",
    end: false,
    label: "Masjid",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 21V11.5c0-1.5.7-2.9 1.9-3.8L12 3l6.1 4.7c1.2.9 1.9 2.3 1.9 3.8V21"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6a3 3 0 0 1 6 0v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M12 3v2.5" />
      </>
    ),
  },
  {
    to: "/",
    end: true,
    label: "Prayer Times",
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    to: "/timetable",
    end: false,
    label: "Timetable",
    icon: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      </>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed left-1/2 z-20 -translate-x-1/2 sm:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-night-deep/85 p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8),0_0_0_1px_rgba(196,147,63,0.08)] backdrop-blur-xl">
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
                    ? "bg-brass/20 text-brass-light shadow-[inset_0_0_0_1px_rgba(196,147,63,0.35)]"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className={`h-5 w-5 shrink-0 ${isActive ? "text-brass" : ""}`}
                  aria-hidden="true"
                >
                  {tab.icon}
                </svg>
                <span
                  className={`overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-300 ${
                    isActive ? "max-w-[7rem] opacity-100" : "max-w-0 opacity-0"
                  }`}
                >
                  {tab.label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
