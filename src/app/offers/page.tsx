import type { Metadata } from "next";
import Link from "next/link";
import { getNationalOffers, categoryLabel } from "@/data/offers";
import type { Offer } from "@/data/offers";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import DisclosureNote from "@/app/components/DisclosureNote";
import TrackLink from "@/app/components/TrackLink";
import { recordRevenueEvent } from "@/lib/revenueMetrics";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Offers & Savings | PriceOfElectricity.com",
  description:
    "Browse electricity offers, savings opportunities, and plan comparisons. National offers and state-specific deals.",
  alternates: { canonical: `${BASE_URL}/offers` },
  openGraph: {
    title: "Offers & Savings | PriceOfElectricity.com",
    description: "Browse electricity offers and savings opportunities.",
    url: `${BASE_URL}/offers`,
  },
};

function groupByCategory(offers: Offer[]): Map<Offer["category"], Offer[]> {
  const map = new Map<Offer["category"], Offer[]>();
  for (const offer of offers) {
    const list = map.get(offer.category) ?? [];
    list.push(offer);
    map.set(offer.category, list);
  }
  return map;
}

export default function OffersPage() {
  const national = getNationalOffers();
  const grouped = groupByCategory(national);

  for (const offer of national) {
    recordRevenueEvent("offer_impression", { offerId: offer.id });
  }

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Offers & Savings",
    description:
      "Browse electricity offers, savings opportunities, and plan comparisons.",
    url: `${BASE_URL}/offers`,
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

      <h1>Offers & Savings</h1>
      <DisclosureNote variant="affiliate" />
      <p>
        Below are optional referrals to electricity plan providers, solar
        installers, and energy efficiency services. These links may include
        affiliate relationships in the future. All offers are clearly marked
        and linking to an offer does not affect the data or analysis on this
        site.
      </p>
      <p className="muted" style={{ marginTop: 0 }}>
        Offers open in a new context via our tracking redirect so we can
        measure interest and improve recommendations over time.
      </p>
      <p className="muted" style={{ fontSize: 12, marginTop: 16, marginBottom: 0 }}>
        Referral links may apply to offers below.
      </p>

      {[...grouped.entries()].map(([category, offers]) => (
        <section key={category} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {categoryLabel(category)}
          </h2>
          <ul style={{ paddingLeft: 20, marginTop: 0 }}>
            {offers.map((offer) => (
              <li key={offer.id} style={{ marginBottom: 10 }}>
                <TrackLink
                  href={`/out/${offer.id}`}
                  eventName="offer_click"
                  payload={{
                    offerId: offer.id,
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
      ))}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>
          State-specific offers
        </h2>
        <p>
          Some states have additional offers tailored to their electricity
          market. For example:{" "}
          <Link href="/offers/texas">Offers in Texas</Link>.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Trust & transparency</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          All rate data on this site is sourced independently.
          See our <Link href="/data-policy">data policy</Link> and{" "}
          <Link href="/sources">sources</Link> for details.
        </p>
      </section>
      <DisclosureNote variant="affiliate" />
    </main>
  );
}
