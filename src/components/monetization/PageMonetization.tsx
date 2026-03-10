import {
  AffiliateReferralLinks,
  CallToActionBlock,
  LeadCapturePrompt,
  PlanComparisonModule,
  ProviderOfferCards,
} from "@/components/monetization/MonetizationBlocks";
import type { MonetizationContext } from "@/lib/monetization/config";
import ProviderHighlightSection from "@/components/providers/ProviderHighlightSection";
import { resolveMonetizationBlocks } from "@/lib/monetization/resolve";
import { resolveProvidersForContext } from "@/lib/providers/resolve";
import type { ProviderServiceCategory } from "@/lib/providers/config";

function getProviderServiceCategory(context: MonetizationContext): ProviderServiceCategory | undefined {
  switch (context.pageType) {
    case "state-authority":
    case "hub-state-detail":
      return "state-provider-listing";
    case "longtail-state-price":
    case "hub-usage-detail":
    case "calculator-state":
      return "electricity-plan-comparison";
    case "longtail-usage":
    case "hub-scenarios":
    case "calculator-national":
      return "lead-generation";
    case "longtail-state-trend":
      return "efficiency";
    case "longtail-industry":
    case "hub-industry-detail":
    case "hub-industry-index":
      return "regional-electricity-service";
    default:
      return undefined;
  }
}

export default function PageMonetization({
  context,
}: {
  context: MonetizationContext;
}) {
  const blocks = resolveMonetizationBlocks(context);
  const providers = resolveProvidersForContext({
    pageType: context.pageType,
    state: context.state,
    serviceCategory: getProviderServiceCategory(context),
  });

  if (blocks.length === 0 && providers.length === 0) return null;

  return (
    <>
      <ProviderHighlightSection
        title={context.stateName ? `Provider options for ${context.stateName}` : "Provider marketplace foundation"}
        intro="This provider section is powered by the structured provider dataset and only appears when matching providers are configured for the page context."
        providers={providers}
      />
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === "provider-offers") {
          return (
            <ProviderOfferCards
              key={key}
              title={block.title}
              intro={block.intro}
              partners={block.partners}
            />
          );
        }

        if (block.kind === "plan-comparison") {
          return <PlanComparisonModule key={key} {...block} />;
        }

        if (block.kind === "cta") {
          return <CallToActionBlock key={key} {...block} />;
        }

        if (block.kind === "lead-capture") {
          return <LeadCapturePrompt key={key} {...block} />;
        }

        return <AffiliateReferralLinks key={key} {...block} />;
      })}
    </>
  );
}
