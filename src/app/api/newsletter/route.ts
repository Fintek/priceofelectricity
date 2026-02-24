import { NextResponse } from "next/server";
import { STATES } from "@/data/states";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewsletterPayload = {
  email?: unknown;
  state?: unknown;
};

export async function POST(request: Request) {
  // RATE LIMITING PLACEHOLDER:
  // Future enhancement: enforce per-IP and per-email throttling before processing payload.
  let payload: NewsletterPayload;

  try {
    payload = (await request.json()) as NewsletterPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const state = typeof payload.state === "string" ? payload.state.trim().toLowerCase() : "all";
  const isValidState = state === "all" || Object.prototype.hasOwnProperty.call(STATES, state);
  if (!isValidState) {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
