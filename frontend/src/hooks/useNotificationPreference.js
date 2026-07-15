import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sewaktu.notifications";

function getBrowserPermission() {
  return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
}

/** Tracks the user's opt-in preference for prayer-change notifications,
 * separately from the browser's own permission grant — both must be true
 * before a notification is actually fired. */
export default function useNotificationPreference() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [permission, setPermission] = useState(getBrowserPermission);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  const enable = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return "unsupported";
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    setEnabled(result === "granted");
    return result;
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
  }, []);

  return { enabled, permission, enable, disable };
}
