import ZoneSelector from "../ZoneSelector";

/** Reuses the same zone/state fetching logic as the prayer-times page's
 * ZoneSelector, just under a name/location that fits the timetable page. */
export default function ZoneSelectorCompact({ zone, onChange, onZoneNameChange }) {
  return <ZoneSelector zone={zone} onChange={onChange} onZoneNameChange={onZoneNameChange} />;
}
