import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { buildNormalizedState } from "@/lib/stateBuilder";
import { buildBillSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 2592000;

type BillParams = Promise<{ state: string; kwh: string }>;

function resolveSlug(rawState: string): string | null {
  const slug = normalizeSlug(rawState);
  return isValidStateSlug(slug) ? slug : null;
}

function parseKwh(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 100 || n > 5000) return null;
  return n;
}

export async function generateMetadata({
  params,
}: {
  params: BillParams;
}): Promise<Metadata> {
  const { state, kwh } = await params;
  const slug = resolveSlug(state);
  const kwhNum = parseKwh(kwh);

  if (!slug || kwhNum === null) {
    return {
      title: "Bill estimate not found | PriceOfElectricity.com",
      description: "Bill estimate page not found.",
      alternates: { canonical: `${BASE_URL}/calculator` },
    };
  }

  const ns = buildNormalizedState(slug);
  const estimatedBill = (kwhNum * ns.avgRateCentsPerKwh) / 100;
  const title = `${kwhNum} kWh Electric Bill in ${ns.name} (Energy Estimate)`;
  const description = `Estimate ${kwhNum} kWh electric bill in ${ns.name}: ~$${estimatedBill.toFixed(2)} energy-only at ${ns.avgRateCentsPerKwh}¢/kWh. Excludes delivery fees and taxes.`;
  const canonicalUrl = `${BASE_URL}/${slug}/bill/${kwhNum}`;

  return {
    title: `${title} | PriceOfElectricity.com`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | PriceOfElectricity.com`,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} | PriceOfElectricity.com`,
      description,
    },
  };
}

export default async function BillPage({
  params,
}: {
  params: BillParams;
}) {
  const { state, kwh } = await params;
  const slug = resolveSlug(state);
  const kwhNum = parseKwh(kwh);

  if (!slug || kwhNum === null) {
    notFound();
  }

  const ns = buildNormalizedState(slug);
  const estimatedBill = (kwhNum * ns.avgRateCentsPerKwh) / 100;
  const schema = buildBillSchema(ns, kwhNum);

  const freshnessDotColor =
    ns.freshnessStatus === "fresh"
      ? "#2e7d32"
      : ns.freshnessStatus === "aging"
        ? "#b26a00"
        : "#b00020";

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema.webPage),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema.faq),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {"→"} <Link href="/compare">Compare</Link>{" "}
        {"→"} <Link href={`/${slug}`}>{ns.name}</Link> {"→"} {kwhNum} kWh{" "}
        bill
      </p>

      <h1>{kwhNum} kWh Electric Bill in {ns.name}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Energy-only estimate for {kwhNum} kWh at {ns.name}&apos;s average
        residential rate.
      </p>

      <section style={{ marginTop: 16 }}>
        <p style={{ marginTop: 0, marginBottom: 4 }}>
          <b>Rate:</b> {ns.avgRateCentsPerKwh}¢/kWh
        </p>
        <p style={{ marginTop: 0, marginBottom: 4 }}>
          <b>Estimated energy-only bill:</b> ${estimatedBill.toFixed(2)}
        </p>
        <p style={{ marginTop: 0, marginBottom: 4 }}>
          <b>Affordability index:</b> {ns.affordabilityIndex}/100 (
          {ns.affordabilityCategory})
        </p>
        <p className="muted" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: freshnessDotColor,
              display: "inline-block",
            }}
          />
          <span>{ns.freshnessLabel}</span>
        </p>
      </section>

      <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
        This is an energy-only estimate. Actual bills include delivery fees,
        taxes, fixed charges, and other utility fees. See{" "}
        <Link href="/about">methodology</Link> for details.
      </p>

      <p style={{ marginTop: 16 }}>
        <Link href={`/calculator?kwh=${kwhNum}&state=${slug}`}>
          Use full calculator with different usage
        </Link>
      </p>

      <p className="muted" style={{ marginTop: 12 }}>
        <Link href={`/${slug}`}>Back to {ns.name}</Link> {" | "}
        <Link href="/compare">Compare states</Link> {" | "}
        <Link href="/electricity-cost-calculator">Calculator</Link>
      </p>
    </main>
  );
}
