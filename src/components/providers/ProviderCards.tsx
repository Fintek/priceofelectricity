import TrackLink from "@/app/components/TrackLink";
import { PROVIDER_SERVICE_LABELS } from "@/lib/providers/config";
import type { ResolvedProvider } from "@/lib/providers/resolve";

export default function ProviderCards({
  title,
  intro,
  providers,
}: {
  title: string;
  intro?: string;
  providers: ResolvedProvider[];
}) {
  if (providers.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
      {intro ? (
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6 }}>{intro}</p>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {providers.map((provider) => (
          <div
            key={provider.id}
            style={{
              padding: 16,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              {provider.providerType}
              {provider.sponsored ? " · Sponsored" : ""}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{provider.name}</div>
            <p style={{ marginTop: 0, marginBottom: 10, lineHeight: 1.6 }}>{provider.shortDescription}</p>
            <p className="muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
              Services: {provider.services.map((service) => PROVIDER_SERVICE_LABELS[service]).join(", ")}
            </p>
            <TrackLink
              href={provider.href}
              eventName="offer_click"
              payload={{ offerId: provider.id }}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
            >
              Explore provider
            </TrackLink>
          </div>
        ))}
      </div>
    </section>
  );
}
