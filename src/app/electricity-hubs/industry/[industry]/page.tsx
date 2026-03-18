import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getIndustryConfig } from "@/lib/longtail/industryConfig";
import {
  buildIndustryCardsForStates,
  loadAllTrafficHubStates,
  parseTrafficHubIndustry,
  sortStatesByRate,
} from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const parsed = parseTrafficHubIndustry(industry);
  if (!parsed) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that industry electricity hub.",
      canonicalPath: `/electricity-hubs/industry/${industry}`,
    });
  }

  const config = getIndustryConfig(parsed);
  return buildMetadata({
    title: `${config.displayName} Hub | PriceOfElectricity.com`,
    description:
      `Browse state-by-state ${config.shortLabel} electricity cost pages and related discovery paths built from the site's existing electricity dataset.`,
    canonicalPath: `/electricity-hubs/industry/${industry}`,
  });
}

export default async function IndustryElectricityHubPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const parsed = parseTrafficHubIndustry(industry);
  if (!parsed) notFound();

  const config = getIndustryConfig(parsed);
  const states = await loadAllTrafficHubStates();
  const cheapestStates = sortStatesByRate(states, "asc").slice(0, 8);
  const highestStates = sortStatesByRate(states, "desc").slice(0, 8);
  const canonicalPath = `/electricity-hubs/industry/${industry}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Industry Electricity Cost Hubs", url: "/electricity-hubs/industry" },
    { name: `${config.displayName} Hub`, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `${config.displayName} Hub`,
    description:
      `Browse state-by-state ${config.shortLabel} electricity cost pages and related discovery paths built from the site's existing electricity dataset.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [config.displayName, `${config.shortLabel} electricity cost`, "state electricity scenario pages"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Industry Electricity Cost Hubs", href: "/electricity-hubs/industry" },
          { label: `${config.displayName} Hub` },
        ]}
        title={`${config.displayName} Hub`}
        intro={`This hub organizes the site's ${config.shortLabel} scenario pages by state. It helps users compare how the same load assumption maps to different state electricity rates and funnels discovery into the underlying longtail scenario pages.`}
        stats={[
          { label: "States covered", value: String(states.length) },
          { label: "Example monthly load", value: `${config.monthlyUsageKwh.toLocaleString()} kWh` },
        ]}
        monetizationContext={{
          pageType: "hub-industry-detail",
          industry: parsed,
        }}
        sections={[
          {
            title: `Lower-cost states for ${config.shortLabel}`,
            intro: "These states currently sit at the lower end of the residential rate distribution used for the scenario estimate.",
            cards: buildIndustryCardsForStates(cheapestStates, parsed),
          },
          {
            title: `Higher-cost states for ${config.shortLabel}`,
            intro: "These states currently sit at the higher end of the residential rate distribution used for the scenario estimate.",
            cards: buildIndustryCardsForStates(highestStates, parsed),
          },
          {
            title: `Browse all ${config.shortLabel} state pages`,
            intro: "Use these scenario pages to move from broad industry discovery into state-specific electricity cost context.",
            cards: buildIndustryCardsForStates(states, parsed),
          },
        ]}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Interpretation note</h2>
          <p style={{ marginTop: 0, maxWidth: "65ch", lineHeight: 1.6 }}>
            These pages are directional scenario pages built on the existing statewide residential electricity dataset.
            They are helpful for state-level discovery and early comparison, but they are not a substitute for tariff,
            demand charge, or procurement analysis.
          </p>
        </section>
      </TrafficHubTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
