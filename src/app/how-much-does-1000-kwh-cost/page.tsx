import { permanentRedirect } from "next/navigation";
import { getCanonicalUsageHubPath } from "@/lib/longtail/usageEntryRoutes";

export const dynamic = "force-dynamic";

export default function HowMuchDoes1000KwhCostPage() {
  permanentRedirect(getCanonicalUsageHubPath(1000));
}
