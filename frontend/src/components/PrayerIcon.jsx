const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONS = {
  imsak: (
    <path d="M20.5 14.5a8.5 8.5 0 1 1-11-11 7 7 0 0 0 11 11z" />
  ),
  fajr: (
    <>
      <path d="M4 18h16" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" strokeOpacity="0.6" strokeDasharray="1.5 2" />
      <path d="M12 8v2.5M8.5 11l1.3 1.3M15.5 11l-1.3 1.3" strokeOpacity="0.6" />
    </>
  ),
  syuruk: (
    <>
      <path d="M4 18h16" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M12 4v3M6.3 8.3l2 2M17.7 8.3l-2 2" />
      <path d="M9 21l3-3 3 3" />
    </>
  ),
  dhuhr: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  asr: (
    <>
      <path d="M3 19h18" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 5v2M6 8l1.5 1.5M18 8l-1.5 1.5M3.5 15h3M17.5 15h3" />
    </>
  ),
  maghrib: (
    <>
      <path d="M4 18h16" />
      <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M12 11V8M6.3 10.3l2 2M17.7 10.3l-2 2" />
      <path d="M9 4l3 3 3-3" />
    </>
  ),
  isha: (
    <>
      <path d="M18.5 13.5a7 7 0 1 1-8-8 5.5 5.5 0 0 0 8 8z" />
      <path d="M19.5 5.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
    </>
  ),
};

export default function PrayerIcon({ name, className = "h-5 w-5" }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg {...ICON_PROPS} className={className} aria-hidden="true">
      {path}
    </svg>
  );
}
