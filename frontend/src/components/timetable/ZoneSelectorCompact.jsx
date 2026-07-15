import ZoneSelector from "../ZoneSelector";

/** Reuses the same zone/state fetching logic as the prayer-times page's
 * ZoneSelector, just under a name/location that fits the timetable page.
 * Anything passed as children renders inside the same card (e.g. the date filter). */
export default function ZoneSelectorCompact({ zone, onChange, children }) {
  return (
    <ZoneSelector zone={zone} onChange={onChange}>
      {children}
    </ZoneSelector>
  );
}
