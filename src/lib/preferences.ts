export const PREFERRED_STATE_KEY = "poe_preferred_state";

export function getPreferredState(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(PREFERRED_STATE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export const PREFERRED_STATE_CHANGED = "poe-preferred-state-changed";

export function setPreferredState(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFERRED_STATE_KEY, slug);
    window.dispatchEvent(new CustomEvent(PREFERRED_STATE_CHANGED));
  } catch {
    // ignore
  }
}

export function clearPreferredState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFERRED_STATE_KEY);
    window.dispatchEvent(new CustomEvent(PREFERRED_STATE_CHANGED));
  } catch {
    // ignore
  }
}
