import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { normalizeSlug } from "@/data/slug";
import { isValidStateSlug } from "@/lib/slugGuard";
import { PLAN_TYPES } from "@/data/planTypes";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type PlanTypesParams = Promise<{ state: string }>;

export function generateStaticParams() {
  return Object.keys(STATES).map((state) => ({ state }));
}

function resolveState(rawState: string) {
  const stateSlug = normalizeSlug(rawState);
  if (!isValidStateSlug(stateSlug)) return null;
  const stateInfo = STATES[stateSlug];
  return { stateSlug, stateInfo };
}

export async function generateMetadata({
  params,
}: {
  params: PlanTypesParams;
}): Promise<Metadata> {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) {
    return {
      title: "State not found | PriceOfElectricity.com",
      description: "State plan types page not found.",
      alternates: { canonical: `${BASE_URL}/` },
    };
  }

  const { stateSlug, stateInfo } = resolved;
  const title = `Electricity Plan Types in ${stateInfo.name}`;
  const description = `Compare fixed-rate, variable-rate, time-of-use, prepaid, and green energy plan types in ${stateInfo.name}.`;
  const canonicalUrl = `${BASE_URL}/${stateSlug}/plan-types`;

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

export default async function StatePlanTypesPage({
  params,
}: {
  params: PlanTypesParams;
}) {
  const { state } = await params;
  const resolved = resolveState(state);
  if (!resolved) {
    notFound();
  }

  const { stateSlug, stateInfo } = resolved;

  const faqQ1 = `What electricity plan types are available in ${stateInfo.name}?`;
  const faqA1 = `Common plan categories in ${stateInfo.name} include fixed-rate, variable-rate, time-of-use, prepaid, and green energy options. Availability depends on utility service territory and market rules.`;
  const faqQ2 = `Is a fixed rate or variable rate better in ${stateInfo.name}?`;
  const faqA2 = `It depends on your risk tolerance and market conditions. Fixed rates provide price stability, while variable rates can be flexible but may change month to month.`;

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Electricity Plan Types in ${stateInfo.name}`,
    url: `${BASE_URL}/${stateSlug}/plan-types`,
    description: `Compare fixed-rate, variable-rate, time-of-use, prepaid, and green energy plan types in ${stateInfo.name}.`,
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: faqQ1,
        acceptedAnswer: { "@type": "Answer", text: faqA1 },
      },
      {
        "@type": "Question",
        name: faqQ2,
        acceptedAnswer: { "@type": "Answer", text: faqA2 },
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href={`/${stateSlug}`}>{stateInfo.name}</Link> {"→"} Plan types
      </p>

      <h1>Electricity Plan Types in {stateInfo.name}</h1>
      <p className="intro muted" style={{ marginTop: 0 }}>
        Electricity offers can vary by contract structure and pricing model. Use
        this overview to compare common plan types before selecting a provider.
      </p>

      {PLAN_TYPES.map((planType) => (
        <section key={planType.slug} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>{planType.name}</h2>
          <p style={{ marginTop: 0 }}>{planType.description}</p>
          <p style={{ marginBottom: 6 }}>
            <b>Pros</b>
          </p>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {planType.pros.map((pro) => (
              <li key={pro}>{pro}</li>
            ))}
          </ul>
          <p style={{ marginBottom: 6 }}>
            <b>Cons</b>
          </p>
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {planType.cons.map((con) => (
              <li key={con}>{con}</li>
            ))}
          </ul>
        </section>
      ))}

      <p className="muted" style={{ marginTop: 20 }}>
        Availability varies by utility and market structure.
      </p>

      <p style={{ marginTop: 12 }}>
        <Link href={`/${stateSlug}`}>Back to {stateInfo.name} page</Link> {" | "}
        <Link href="/guides/fixed-vs-variable-electricity-rates">
          Fixed vs variable guide
        </Link>{" "}
        {" | "}
        <Link href="/compare">Compare states</Link>
      </p>
    </main>
  );
}
