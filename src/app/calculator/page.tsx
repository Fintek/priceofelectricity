import { permanentRedirect } from "next/navigation";

export const dynamic = "force-static";

export default function CalculatorPage() {
  permanentRedirect("/electricity-cost-calculator");
}
