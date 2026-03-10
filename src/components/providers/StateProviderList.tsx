import Link from "next/link";
import TrackLink from "@/app/components/TrackLink";
import type { ResolvedProvider } from "@/lib/providers/resolve";

export default function StateProviderList({
  stateName,
  providers,
}: {
  stateName: string;
  providers: ResolvedProvider[];
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Provider listings for {stateName}</h2>
      {providers.length === 0 ? (
        <p className="muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          No provider records are configured for {stateName} yet. This framework is in place so future marketplace,
          supplier, and energy service integrations can be added without changing the page architecture.
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {providers.map((provider) => (
            <li key={provider.id}>
              <TrackLink
                href={provider.href}
                eventName="offer_click"
                payload={{ offerId: provider.id }}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
              >
                {provider.name}
              </TrackLink>
              {` — ${provider.shortDescription}`}
            </li>
          ))}
        </ul>
      )}
      <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
        Provider listings remain separate from the site&apos;s educational content. See <Link href="/disclosures">disclosures</Link>.
      </p>
    </section>
  );
}
