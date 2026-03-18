import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageHubPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-dynamic";

export default function HowMuchDoes500KwhCostPage() {
  permanentRedirect(getCanonicalUsageHubPath(500));
}
