import { useEffect, useState } from "react";

/**
 * Debounced live-region text for calculator status announcements (500ms).
 */
export function useDebouncedAnnounce(statusText: string, delayMs = 500): string {
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(statusText), delayMs);
    return () => window.clearTimeout(timer);
  }, [statusText, delayMs]);

  return announced;
}
