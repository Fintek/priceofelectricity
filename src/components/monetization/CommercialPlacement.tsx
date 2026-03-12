import CommercialModule from "@/components/monetization/CommercialModule";
import type { MonetizationContext } from "@/lib/monetization/config";
import {
  getEnabledCommercialModuleRules,
  isProviderModuleAllowedInFamily,
  isProviderModuleType,
  type CommercialPageFamily,
} from "@/lib/monetization/placementConfig";
import { isProviderPilotActiveForContext } from "@/lib/providers/providerPilot";

export default function CommercialPlacement({
  pageFamily,
  context,
}: {
  pageFamily: CommercialPageFamily;
  context: MonetizationContext;
}) {
  const moduleRules = getEnabledCommercialModuleRules(pageFamily);
  if (moduleRules.length === 0) return null;

  const eligibleRules = moduleRules
    .filter((rule) => isProviderModuleAllowedInFamily(pageFamily, rule.type))
    .filter((rule) => {
      if (!isProviderModuleType(rule.type)) return true;
      return isProviderPilotActiveForContext({
        pageFamily,
        moduleType: rule.type,
        state: context.state,
      });
    });

  if (eligibleRules.length === 0) return null;

  return (
    <>
      {eligibleRules.map((rule) => (
        <CommercialModule
          key={`${pageFamily}-${rule.type}-${rule.priority}`}
          pageFamily={pageFamily}
          type={rule.type}
          context={context}
        />
      ))}
    </>
  );
}
