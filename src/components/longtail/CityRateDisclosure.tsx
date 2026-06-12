import Link from "next/link";
import type { CSSProperties } from "react";

type CityRateDisclosureProps = {
  eiaMonthLabel: string | null;
  style?: CSSProperties;
};

export default function CityRateDisclosure({ eiaMonthLabel, style }: CityRateDisclosureProps) {
  const label = eiaMonthLabel?.trim() || "current";

  return (
    <p style={{ marginTop: 0, lineHeight: 1.7, ...style }}>
      City rate is modeled from the {label} EIA state average with a population-based adjustment.{" "}
      <Link href="/methodology/electricity-rates">See methodology</Link>.
    </p>
  );
}
