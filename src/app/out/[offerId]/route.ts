import { NextResponse } from "next/server";
import { OFFER_BY_ID } from "@/data/offers";
import { recordRevenueEvent } from "@/lib/revenueMetrics";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await params;
  const offer = OFFER_BY_ID[offerId];

  if (!offer || !offer.active) {
    return new NextResponse("Not Found", { status: 404 });
  }

  recordRevenueEvent("offer_click", {
    offerId,
    state: offer.stateSlug,
  });

  const url = new URL(offer.destinationUrl);
  url.searchParams.set("utm_source", "priceofelectricity.com");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "offers");
  url.searchParams.set("utm_content", offerId);
  url.searchParams.set("ref", "poe");
  if (offer.stateSlug) {
    url.searchParams.set("utm_term", offer.stateSlug);
  }

  return NextResponse.redirect(url.toString(), 307);
}
