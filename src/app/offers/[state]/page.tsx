import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import {
  getOffersForState,
  getStateSpecificOffers,
  getNationalOffers,
  categoryLabel,
} from "@/data/offers";
import type { Offer } from "@/data/offers";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import DisclosureNote from "@/app/components/DisclosureNote";
import TrackLink from "@/app/components/TrackLink";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";
import { recordRevenueEvent } from "@/lib/revenueMetrics";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;
export const dynamicParams = false;

type StateOfferParams = Promise<{ state: string }>;

export function generateStaticParams() {
  return Object.keys(STATES).map((slug) => ({ state: slug }));
}

function resolveSlug(raw: string): string | null {
  const slug = normalizeSlug(raw);
  return isValidStateSlug(slug) ? slug : null;
}

export async function generateMetadata({
  params,
}: {
  params: StateOfferParams;
}): Promise<Metadata> {
  const { state } = await params;
  const slug = resolveSlug(state);
  if (!slug) return {};
  const info = STATES[slug];
  return {
    title: `Offers & Savings in ${info.name} | PriceOfElectricity.com`,
    description: `Browse electricity offers, plan comparisons, and savings opportunities in ${info.name}.`,
    alternates: { canonical: `${BASE_URL}/offers/${slug}` },
    openGraph: {
      title: `Offers & Savings in ${info.name} | PriceOfElectricity.com`,
      description: `Electricity offers and savings in ${info.name}.`,
      url: `${BASE_URL}/offers/${slug}`,
    },
  };
}

function groupByCategory(offers: Offer[]): Map<Offer["category"], Offer[]> {
  const map = new Map<Offer["category"], Offer[]>();
  for (const offer of offers) {
    const list = map.get(offer.category) ?? [];
    list.push(offer);
    map.set(offer.category, list);
  }
  return map;
}

export default async function StateOffersPage({
  params,
}: {
  params: StateOfferParams;
}) {
  const { state } = await params;
  const slug = resolveSlug(state);
  if (!slug) notFound();

  const info = STATES[slug];
  const stateSpecific = getStateSpecificOffers(slug);
  const national = getNationalOffers();
  const allOffers = getOffersForState(slug);
  const grouped = groupByCategory(allOffers);

  for (const offer of allOffers) {
    recordRevenueEvent("offer_impression", { state: slug, offerId: offer.id });
  }

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Offers & Savings in ${info.name}`,
    description: `Browse electricity offers and savings opportunities in ${info.name}.`,
    url: `${BASE_URL}/offers/${slug}`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/offers">Offers</Link> {"→"} {info.name}
      </p>
      <h1>Offers & Savings in {info.name}</h1>
      <DisclosureNote variant="affiliate" />
      <p>
        Below are electricity offers and savings opportunities relevant to{" "}
        {info.name}. State-specific offers are listed first, followed by
        national options. These links may include affiliate relationships in
        the future.
      </p>
      <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>
        Referral links may apply to offers below.
      </p>

      {stateSpecific.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {info.name} offers
          </h2>
          <ul style={{ paddingLeft: 20, marginTop: 0 }}>
            {stateSpecific.map((offer) => (
              <li key={offer.id} style={{ marginBottom: 10 }}>
                <TrackLink
                  href={`/out/${offer.id}`}
                  eventName="offer_click"
                  payload={{
                    offerId: offer.id,
                    state: slug,
                    category: offer.category,
                  }}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                >
                  {offer.title}
                </TrackLink>
                <br />
                <span className="muted" style={{ fontSize: 14 }}>
                  {offer.description}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {national.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>National offers</h2>
          {[...groupByCategory(national).entries()].map(
            ([category, offers]) => (
              <div key={category} style={{ marginBottom: 12 }}>
                <p
                  className="muted"
                  style={{ marginBottom: 4, marginTop: 0, fontSize: 13 }}
                >
                  {categoryLabel(category)}
                </p>
                <ul style={{ paddingLeft: 20, marginTop: 0 }}>
                  {offers.map((offer) => (
                    <li key={offer.id} style={{ marginBottom: 10 }}>
                      <TrackLink
                        href={`/out/${offer.id}`}
                        eventName="offer_click"
                        payload={{
                          offerId: offer.id,
                          state: slug,
                          category: offer.category,
                        }}
                        target="_blank"
                        rel="sponsored nofollow noopener noreferrer"
                      >
                        {offer.title}
                      </TrackLink>
                      <br />
                      <span className="muted" style={{ fontSize: 14 }}>
                        {offer.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          Shop electricity plans
        </h2>
        <p>
          <Link href={`/${slug}/plans`} style={{ fontWeight: 600 }}>
            View electricity plans in {info.name}
          </Link>
        </p>
      </section>

      <RelatedLinks links={getRelatedLinks({ kind: "state", state: slug, from: "offers" })} />

      <p className="muted" style={{ marginTop: 20, fontSize: 13 }}>
        All rate data is sourced independently.
        See our <Link href="/data-policy">data policy</Link> and{" "}
        <Link href="/sources">sources</Link>.
      </p>
      <DisclosureNote variant="affiliate" />
    </main>
  );
}
