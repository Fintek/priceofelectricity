import {
  AffiliateReferralLinks,
  CallToActionBlock,
  LeadCapturePrompt,
  PlanComparisonModule,
  ProviderOfferCards,
} from "@/components/monetization/MonetizationBlocks";
import CommercialComplianceNote from "@/components/monetization/CommercialComplianceNote";
import type { MonetizationContext } from "@/lib/monetization/config";
import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";
import { resolveMonetizationBlocks } from "@/lib/monetization/resolve";
import { resolveProviderMarketplaceOffers } from "@/lib/providers/providerResolver";
import { PROVIDER_DISCOVERY_SECTION_INTRO } from "@/lib/providers/providerDiscovery";

const PROVIDER_COMPARISON_HEADING = "Provider marketplace comparison";
const MARKETPLACE_PATHWAY_HEADING = "Marketplace pathways";
const COMMERCIAL_DISCOVERY_NOTE =
  PROVIDER_DISCOVERY_SECTION_INTRO;

function getOfferTypeLabel(type: "supplier" | "marketplace" | "affiliate"): string {
  if (type === "marketplace") return "Marketplace";
  if (type === "supplier") return "Supplier";
  return "Affiliate";
}

function getOfferCtaLabel(type: "supplier" | "marketplace" | "affiliate"): string {
  if (type === "marketplace") return "View marketplace options";
  if (type === "supplier") return "View supplier details";
  return "View partner offer";
}

function buildOfferMixSummary(offers: Array<{ offerType: "supplier" | "marketplace" | "affiliate" }>): string {
  const counts = {
    marketplace: 0,
    supplier: 0,
    affiliate: 0,
  };
  for (const offer of offers) {
    counts[offer.offerType] += 1;
  }
  const parts: string[] = [];
  if (counts.marketplace > 0) parts.push(`${counts.marketplace} marketplace`);
  if (counts.supplier > 0) parts.push(`${counts.supplier} supplier`);
  if (counts.affiliate > 0) parts.push(`${counts.affiliate} affiliate`);
  return parts.join(" · ");
}

function renderProviderComparison(
  pageFamily: CommercialPageFamily,
  context: MonetizationContext,
) {
  const offers = resolveProviderMarketplaceOffers({
    state: context.state,
    pageFamily,
    moduleType: "provider-comparison",
    maxResults: 4,
  });
  if (offers.length === 0) return null;

  const hasAffiliate = offers.some((offer) => offer.hasAffiliateDisclosure);

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>
        {context.stateName
          ? `${PROVIDER_COMPARISON_HEADING} for ${context.stateName}`
          : PROVIDER_COMPARISON_HEADING}
      </h2>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "70ch", lineHeight: 1.6 }}>
        These provider offers are commercial placements shown in approved contexts. They do not change the
        informational/canonical purpose of this page and do not imply utility affiliation or official endorsement.
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13, lineHeight: 1.5 }}>
        {COMMERCIAL_DISCOVERY_NOTE}
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
        Comparison summary: {buildOfferMixSummary(offers)}. Ranked deterministically by rollout eligibility,
        provider priority, and offer-type diversity.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {offers.map((offer) => (
          <article
            key={offer.providerId}
            style={{
              padding: 16,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <p className="muted" style={{ marginTop: 0, marginBottom: 6, fontSize: 12 }}>
              {getOfferTypeLabel(offer.offerType)}
            </p>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 17 }}>{offer.providerName}</h3>
            <p style={{ marginTop: 0, marginBottom: 10, lineHeight: 1.6 }}>{offer.offerDescription}</p>
            <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
              <strong>Coverage:</strong> {offer.coverageAreaDescription}
            </p>
            <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
              <strong>Plan context:</strong> {offer.planTypeSummary}
            </p>
            {offer.featureHighlights.length > 0 ? (
              <ul style={{ marginTop: 0, marginBottom: 10, paddingLeft: 18, lineHeight: 1.6 }}>
                {offer.featureHighlights.slice(0, 3).map((highlight) => (
                  <li key={`${offer.providerId}-${highlight}`}>{highlight}</li>
                ))}
              </ul>
            ) : null}
            {offer.regulatoryNotes ? (
              <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
                {offer.regulatoryNotes}
              </p>
            ) : null}
            <a
              href={offer.signupUrl}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              style={{ fontWeight: 600 }}
            >
              {getOfferCtaLabel(offer.offerType)}
            </a>
          </article>
        ))}
      </div>
      <CommercialComplianceNote hasAffiliateOffer={hasAffiliate} />
    </section>
  );
}

function renderMarketplaceCta(
  pageFamily: CommercialPageFamily,
  context: MonetizationContext,
) {
  const offers = resolveProviderMarketplaceOffers({
    state: context.state,
    pageFamily,
    moduleType: "marketplace-cta",
    maxResults: 1,
  });
  if (offers.length > 0) {
    const offer = offers[0];
    return (
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>{MARKETPLACE_PATHWAY_HEADING}</h2>
        <p style={{ marginTop: 0, marginBottom: 8, maxWidth: "68ch", lineHeight: 1.6 }}>
          Optional marketplace pathway for users who want next-step provider shopping after reviewing this
          informational page.
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
          {COMMERCIAL_DISCOVERY_NOTE}
        </p>
        <p style={{ marginTop: 0, marginBottom: 8 }}>
          <strong>{offer.providerName}</strong>: {offer.offerDescription}
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
          <strong>Coverage:</strong> {offer.coverageAreaDescription}
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
          <strong>Plan context:</strong> {offer.planTypeSummary}
        </p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          <a
            href={offer.signupUrl}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            style={{ fontWeight: 600 }}
          >
            {offer.offerType === "marketplace" ? "Continue to marketplace" : getOfferCtaLabel(offer.offerType)}
          </a>
        </p>
        <CommercialComplianceNote hasAffiliateOffer={offer.hasAffiliateDisclosure} />
      </section>
    );
  }

  const blocks = resolveMonetizationBlocks(context);
  const plan = blocks.find((block) => block.kind === "plan-comparison");
  if (plan?.kind === "plan-comparison") return <PlanComparisonModule {...plan} />;
  const cta = blocks.find((block) => block.kind === "cta");
  if (cta?.kind === "cta") return <CallToActionBlock {...cta} />;
  return null;
}

function renderAffiliateLinks(context: MonetizationContext) {
  const blocks = resolveMonetizationBlocks(context);
  const affiliate = blocks.find((block) => block.kind === "affiliate-links");
  if (affiliate?.kind === "affiliate-links") {
    return <AffiliateReferralLinks {...affiliate} />;
  }
  const offers = blocks.find((block) => block.kind === "provider-offers");
  if (offers?.kind === "provider-offers") {
    return <ProviderOfferCards title={offers.title} intro={offers.intro} partners={offers.partners} />;
  }
  return null;
}

function renderEducationalOffer(context: MonetizationContext) {
  const blocks = resolveMonetizationBlocks(context);
  const lead = blocks.find((block) => block.kind === "lead-capture");
  if (lead?.kind === "lead-capture") {
    return <LeadCapturePrompt {...lead} />;
  }
  const cta = blocks.find((block) => block.kind === "cta");
  if (cta?.kind === "cta") {
    return <CallToActionBlock {...cta} />;
  }
  return null;
}

export default function CommercialModule({
  pageFamily,
  type,
  context,
}: {
  pageFamily: CommercialPageFamily;
  type: CommercialModuleType;
  context: MonetizationContext;
}) {
  if (type === "provider-comparison") {
    return renderProviderComparison(pageFamily, context);
  }

  if (type === "marketplace-cta") {
    return renderMarketplaceCta(pageFamily, context);
  }

  if (type === "affiliate-link-block") {
    return renderAffiliateLinks(context);
  }

  return renderEducationalOffer(context);
}
