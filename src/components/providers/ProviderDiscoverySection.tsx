import Link from "next/link";
import {
  PROVIDER_DISCOVERY_SECTION_INTRO,
  PROVIDER_DISCOVERY_SECTION_TITLE,
  type ProviderDiscoveryLink,
} from "@/lib/providers/providerDiscovery";

export default function ProviderDiscoverySection({
  links,
  title = PROVIDER_DISCOVERY_SECTION_TITLE,
  intro = PROVIDER_DISCOVERY_SECTION_INTRO,
  headingSize = 22,
  marginBottom = 28,
}: {
  links: ProviderDiscoveryLink[];
  title?: string;
  intro?: string;
  headingSize?: number;
  marginBottom?: number;
}) {
  if (links.length === 0) return null;

  return (
    <section style={{ marginBottom }}>
      <h2 style={{ fontSize: headingSize, marginBottom: 10 }}>{title}</h2>
      <p style={{ marginTop: 0, lineHeight: 1.7 }}>{intro}</p>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href}>{link.label}</Link>
            {link.companionHref && link.companionLabel ? (
              <>
                {" · "}
                <Link href={link.companionHref}>{link.companionLabel}</Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
