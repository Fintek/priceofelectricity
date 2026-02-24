import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug, isValidUtilitySlug } from "@/lib/slugGuard";
import { getUtility, UTILITIES } from "@/data/utilities";
import { buildNormalizedState } from "@/lib/stateBuilder";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type UtilityParams = Promise<{ state: string; utilitySlug: string }>;

export function generateStaticParams() {
  return UTILITIES.map((utility) => ({
    state: utility.stateSlug,
    utilitySlug: utility.slug,
  }));
}

function resolveSlug(rawState: string): string | null {
  const stateSlug = normalizeSlug(rawState);
  return isValidStateSlug(stateSlug) ? stateSlug : null;
}

export async function generateMetadata({
  params,
}: {
  params: UtilityParams;
}): Promise<Metadata> {
  const { state, utilitySlug } = await params;
  const stateSlug = resolveSlug(state);
  if (!stateSlug) {
    return {
      title: "Utility not found | PriceOfElectricity.com",
      description: "Utility page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const stateInfo = STATES[stateSlug];
  const utility = getUtility(stateSlug, utilitySlug);
  if (!utility) {
    return {
      title: "Utility not found | PriceOfElectricity.com",
      description: "Utility page not found.",
      alternates: { canonical: `${BASE_URL}/${stateSlug}/utilities` },
    };
  }

  const title = `${utility.name} Electricity Rates | ${stateInfo.name}`;
  const description = `Average electricity rate context for ${utility.name} in ${stateInfo.name}, with a 1000 kWh energy-only bill example.`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/utility/${utility.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function UtilityPage({
  params,
}: {
  params: UtilityParams;
}) {
  const { state, utilitySlug } = await params;
  const stateSlug = resolveSlug(state);
  if (!stateSlug) {
    notFound();
  }

  const utility = getUtility(stateSlug, utilitySlug);
  if (!utility) {
    notFound();
  }

  const ns = buildNormalizedState(stateSlug);
  const rateCentsPerKwh = utility.avgRateCentsPerKwh ?? ns.avgRateCentsPerKwh;
  const billAt1000Kwh = rateCentsPerKwh * 10;

  const freshnessDotColor =
    ns.freshnessStatus === "fresh"
      ? "#2e7d32"
      : ns.freshnessStatus === "aging"
        ? "#b26a00"
        : "#b00020";

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${utility.name} Electricity Rates`,
    url: `${BASE_URL}/${stateSlug}/utility/${utility.slug}`,
    description: `Average electricity rate context for ${utility.name} in ${ns.name}.`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Utility Service Area",
        value: ns.name,
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href={`/${stateSlug}`}>{ns.name}</Link> {"→"}{" "}
        <Link href={`/${stateSlug}/utilities`}>Utilities</Link> {"→"} <span>{utility.name}</span>
      </p>
      <h1>{utility.name} Electricity Rates</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        State context for {ns.name}. Utility-specific rates may differ by tariff and service
        class.
      </p>
      <p>
        Rate: <b>{rateCentsPerKwh.toFixed(2)}¢/kWh</b>
      </p>
      <p>
        Example bill at 1000 kWh (energy-only): <b>${billAt1000Kwh.toFixed(2)}</b>
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
      <p className="muted" style={{ marginTop: 6 }}>
        Rates may vary by plan and customer class.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href={`/${stateSlug}`}>Back to {ns.name} electricity page</Link>
      </p>
    </main>
  );
}
