export type EventName =
  | "page_view"
  | "offer_impression"
  | "offer_click"
  | "alert_submit"
  | "plan_view"
  | "data_download_click"
  | "knowledge_view";

export type EventPayloads = {
  page_view: {
    path: string;
    state?: string;
  };
  offer_impression: {
    offerId: string;
    state?: string;
    category?: string;
  };
  offer_click: {
    offerId: string;
    state?: string;
    category?: string;
  };
  alert_submit: {
    area: "regulatory" | "ai-energy" | "state";
    state?: string;
    frequency?: string;
    topics?: string[];
  };
  plan_view: {
    state: string;
  };
  data_download_click: {
    dataset: string;
  };
  knowledge_view: {
    format: "page" | "json";
  };
};

type GtagFn = (
  command: "event",
  eventName: string,
  payload: Record<string, unknown>
) => void;

type PosthogClient = {
  capture: (eventName: string, payload: Record<string, unknown>) => void;
};

export function emitEvent<N extends EventName>(
  name: N,
  payload: EventPayloads[N]
): void {
  if (typeof window === "undefined") return;

  try {
    const withAnalytics = window as Window & {
      gtag?: GtagFn;
      posthog?: PosthogClient;
    };

    const normalizedPayload = payload as Record<string, unknown>;

    if (typeof withAnalytics.gtag === "function") {
      withAnalytics.gtag("event", name, normalizedPayload);
      return;
    }

    if (
      withAnalytics.posthog &&
      typeof withAnalytics.posthog.capture === "function"
    ) {
      withAnalytics.posthog.capture(name, normalizedPayload);
    }
  } catch {
    // Swallow errors to avoid affecting navigation or rendering.
  }
}
