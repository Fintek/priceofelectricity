import { NextResponse } from "next/server";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import {
  storeAlertSignup,
  type AlertArea,
  type AlertSignup,
} from "@/lib/alertSignupStore";
import { log, maskEmail } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ParsedPayload = {
  email?: string;
  area?: string;
  state?: string;
  region?: string;
  frequency?: string;
  topics?: string[];
  redirectTo?: string;
};

function toStringValue(input: FormDataEntryValue | unknown): string | undefined {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function parseTopicsFromForm(formData: FormData): string[] | undefined {
  const values = formData
    .getAll("topics")
    .map((v) => toStringValue(v))
    .filter((v): v is string => !!v);
  return values.length > 0 ? values : undefined;
}

function parseTopicsFromJson(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : undefined;
  }
  if (Array.isArray(value)) {
    const values = value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    return values.length > 0 ? values : undefined;
  }
  return undefined;
}

async function parsePayload(request: Request): Promise<ParsedPayload> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      email: toStringValue(body.email),
      area: toStringValue(body.area),
      state: toStringValue(body.state),
      region: toStringValue(body.region),
      frequency: toStringValue(body.frequency),
      topics: parseTopicsFromJson(body.topics),
      redirectTo: toStringValue(body.redirectTo),
    };
  }

  const formData = await request.formData();
  return {
    email: toStringValue(formData.get("email")),
    area: toStringValue(formData.get("area")),
    state: toStringValue(formData.get("state")),
    region: toStringValue(formData.get("region")),
    frequency: toStringValue(formData.get("frequency")),
    topics: parseTopicsFromForm(formData),
    redirectTo: toStringValue(formData.get("redirectTo")),
  };
}

function normalizeArea(area: string | undefined): AlertArea | null {
  if (area === "regulatory" || area === "ai-energy" || area === "state") {
    return area;
  }
  return null;
}

function normalizeFrequency(value: string | undefined): "weekly" | "monthly" | undefined {
  if (!value) return undefined;
  if (value === "weekly" || value === "monthly") return value;
  return undefined;
}

function normalizeState(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const slug = normalizeSlug(value);
  if (slug === "all") return undefined;
  if (Object.prototype.hasOwnProperty.call(STATES, slug)) return slug;
  return undefined;
}

function isValidEmail(email: string | undefined): email is string {
  return !!email && email.includes("@");
}

function getSafeRedirectTarget(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function responseNoStore(data: object, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validateSignupAbuse(
  payload: ParsedPayload,
): string | null {
  if (payload.email && payload.email.length > 254) {
    return "email_too_long";
  }
  if (payload.email && (payload.email.split("+").length - 1) > 3) {
    return "email_suspicious";
  }
  if (payload.topics && payload.topics.length > 10) {
    return "too_many_topics";
  }
  if (
    payload.frequency !== undefined &&
    payload.frequency !== "weekly" &&
    payload.frequency !== "monthly"
  ) {
    return "invalid_frequency";
  }
  return null;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "";
  const payload = await parsePayload(request);

  const abuseReason = validateSignupAbuse(payload);
  if (abuseReason) {
    log("warn", "alert signup abuse rejected", {
      requestId,
      route: "/api/alerts/signup",
      reason: abuseReason,
    });
    return responseNoStore({ ok: false, error: abuseReason }, 400);
  }

  if (!isValidEmail(payload.email)) {
    log("warn", "alert signup invalid email", {
      requestId,
      route: "/api/alerts/signup",
      reason: "invalid_email",
    });
    return responseNoStore({ ok: false, error: "invalid_email" }, 400);
  }

  const area = normalizeArea(payload.area);
  if (!area) {
    log("warn", "alert signup invalid area", {
      requestId,
      route: "/api/alerts/signup",
      reason: "invalid_area",
    });
    return responseNoStore({ ok: false, error: "invalid_area" }, 400);
  }

  if (payload.state && !normalizeState(payload.state)) {
    log("warn", "alert signup invalid state", {
      requestId,
      route: "/api/alerts/signup",
      reason: "invalid_state",
      state: payload.state,
    });
    return responseNoStore({ ok: false, error: "invalid_state" }, 400);
  }

  const signup: AlertSignup = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    email: payload.email,
    area,
    state: normalizeState(payload.state),
    region: payload.region,
    frequency: normalizeFrequency(payload.frequency),
    topics: payload.topics,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  const result = await storeAlertSignup(signup);

  log("info", "alert signup success", {
    requestId,
    route: "/api/alerts/signup",
    signupId: signup.id,
    email: maskEmail(signup.email),
    area: signup.area,
    state: signup.state,
  });

  const redirectTo = getSafeRedirectTarget(payload.redirectTo);
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url), {
      status: 303,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return responseNoStore({ ok: true, result });
}
