import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageHubPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-dynamic";

export default function HowMuchDoes2000KwhCostPage() {
  permanentRedirect(getCanonicalUsageHubPath(2000));
}
