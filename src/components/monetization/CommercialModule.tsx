import Link from "next/link";
import TrackedOutboundLink from "@/app/components/TrackedOutboundLink";
import {
  AffiliateReferralLinks,
  CallToActionBlock,
  LeadCapturePrompt,
  PlanComparisonModule,
  ProviderOfferCards,
} from "@/components/monetization/MonetizationBlocks";
import CommercialComplianceNote from "@/components/monetization/CommercialComplianceNote";
import CommercialImpressionTracker from "@/components/monetization/CommercialImpressionTracker";
import type { MonetizationContext } from "@/lib/monetization/config";
import type {
  CommercialModuleType,
  CommercialPageFamily,
} from "@/lib/monetization/placementConfig";
import { resolveMonetizationBlocks } from "@/lib/monetization/resolve";
import { resolveProviderMarketplaceOffers } from "@/lib/providers/providerResolver";

function getOfferCtaLabel(type: "supplier" | "marketplace" | "affiliate"): string {
  if (type === "marketplace") return "Compare plans";
  if (type === "supplier") return "View provider details";
  return "See offer";
}

function buildCommercialTrackingProps({
  moduleType,
  pageFamily,
  context,
  providerId,
  offerType,
}: {
  moduleType: "provider-comparison" | "marketplace-cta";
  pageFamily: CommercialPageFamily;
  context: MonetizationContext;
  providerId: string;
  offerType: "supplier" | "marketplace" | "affiliate";
}): Record<string, string> {
  return {
    moduleType,
    pageFamily,
    pageType: context.pageType,
    providerId,
    offerType,
    ...(context.state ? { state: context.state } : {}),
  };
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
  const heading = context.stateName
    ? `Compare providers in ${context.stateName}`
    : "Compare electricity providers";

  return (
    <section className="commercial-module">
      <span className="commercial-module-label">Partner offers</span>
      <h2>{heading}</h2>
      <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6, fontSize: 14 }}>
        These offers are from partner providers shown alongside our independent data.
        They do not imply utility affiliation or endorsement.
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
              backgroundColor: "#fff",
            }}
          >
            <CommercialImpressionTracker
              eventName="CommercialOfferImpression"
              props={buildCommercialTrackingProps({
                moduleType: "provider-comparison",
                pageFamily,
                context,
                providerId: offer.providerId,
                offerType: offer.offerType,
              })}
            />
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 17 }}>{offer.providerName}</h3>
            <p style={{ marginTop: 0, marginBottom: 10, lineHeight: 1.6, fontSize: 14 }}>{offer.offerDescription}</p>
            <p className="muted" style={{ marginTop: 0, marginBottom: 10, fontSize: 13, lineHeight: 1.5 }}>
              {offer.coverageAreaDescription}
            </p>
            {offer.featureHighlights.length > 0 ? (
              <ul style={{ marginTop: 0, marginBottom: 10, paddingLeft: 18, lineHeight: 1.6, fontSize: 14 }}>
                {offer.featureHighlights.slice(0, 3).map((highlight) => (
                  <li key={`${offer.providerId}-${highlight}`}>{highlight}</li>
                ))}
              </ul>
            ) : null}
            <TrackedOutboundLink
              href={offer.signupUrl}
              eventName="CommercialOfferClick"
              props={buildCommercialTrackingProps({
                moduleType: "provider-comparison",
                pageFamily,
                context,
                providerId: offer.providerId,
                offerType: offer.offerType,
              })}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="commercial-cta-primary"
            >
              {getOfferCtaLabel(offer.offerType)}
            </TrackedOutboundLink>
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
    const trackingProps = buildCommercialTrackingProps({
      moduleType: "marketplace-cta",
      pageFamily,
      context,
      providerId: offer.providerId,
      offerType: offer.offerType,
    });
    return (
      <section className="commercial-module">
        <CommercialImpressionTracker
          eventName="CommercialOfferImpression"
          props={trackingProps}
        />
        <span className="commercial-module-label">Partner offers</span>
        <h2>
          {context.stateName
            ? `Explore provider options in ${context.stateName}`
            : "Explore provider options"}
        </h2>
        <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6, fontSize: 14 }}>
          Ready to explore provider options? This partner link connects you to plans available in your area.
        </p>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 14 }}>
          <strong>{offer.providerName}</strong>: {offer.offerDescription}
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
          {offer.coverageAreaDescription}
        </p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          <TrackedOutboundLink
            href={offer.signupUrl}
            eventName="CommercialOfferClick"
            props={trackingProps}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
            className="commercial-cta-primary"
          >
            {offer.offerType === "marketplace" ? "Compare plans" : getOfferCtaLabel(offer.offerType)}
          </TrackedOutboundLink>
          {" · "}
          <Link href="/electricity-providers" className="commercial-cta-secondary">Browse all providers</Link>
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
