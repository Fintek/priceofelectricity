import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageHubPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-static";

export default function HowMuchDoes500KwhCostPage() {
  permanentRedirect(getCanonicalUsageHubPath(500));
}
