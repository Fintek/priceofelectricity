import Link from "next/link";
import DisclosureNote from "@/app/components/DisclosureNote";
import TrackLink from "@/app/components/TrackLink";
import type { ResolvedMonetizationBlock, ResolvedPartnerLink } from "@/lib/monetization/resolve";

function MonetizationShell({
  label,
  title,
  children,
}: {
  label?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="commercial-module">
      <span className="commercial-module-label">{label ?? "Partner offers"}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PartnerBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="muted"
          style={{
            fontSize: 12,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1px solid var(--color-border, #e5e7eb)",
            backgroundColor: "#fff",
          }}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

export function ProviderOfferCards({
  title,
  intro,
  partners,
}: {
  title: string;
  intro: string;
  partners: ResolvedPartnerLink[];
}) {
  if (partners.length === 0) return null;

  return (
    <MonetizationShell title={title}>
      <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6 }}>{intro}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {partners.map((partner) => (
          <div
            key={partner.id}
            style={{
              padding: 16,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "#fff",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 6 }}>{partner.headline}</div>
            <PartnerBadges badges={partner.badges} />
            <p style={{ marginTop: 0, marginBottom: 12, lineHeight: 1.6, fontSize: 14 }}>{partner.description}</p>
            <TrackLink
              href={partner.href}
              eventName="offer_click"
              payload={{ offerId: partner.id }}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="commercial-cta-primary"
            >
              {partner.ctaLabel}
            </TrackLink>
          </div>
        ))}
      </div>
      <DisclosureNote variant="affiliate" />
    </MonetizationShell>
  );
}

export function PlanComparisonModule({
  title,
  description,
  primary,
  secondary,
}: Extract<ResolvedMonetizationBlock, { kind: "plan-comparison" }>) {
  return (
    <MonetizationShell label="Compare options" title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} className="commercial-cta-primary">
          {primary.label}
        </Link>
        {secondary ? (
          <span className="commercial-cta-secondary">
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </span>
        ) : null}
      </p>
    </MonetizationShell>
  );
}

export function CallToActionBlock({
  title,
  description,
  primary,
  secondary,
}: Extract<ResolvedMonetizationBlock, { kind: "cta" }>) {
  return (
    <MonetizationShell label="Helpful services" title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} className="commercial-cta-primary">
          {primary.label}
        </Link>
        {secondary ? (
          <span className="commercial-cta-secondary">
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </span>
        ) : null}
      </p>
    </MonetizationShell>
  );
}

export function LeadCapturePrompt({
  title,
  description,
  primary,
  secondary,
}: Extract<ResolvedMonetizationBlock, { kind: "lead-capture" }>) {
  return (
    <MonetizationShell label="Stay informed" title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} className="commercial-cta-primary">
          {primary.label}
        </Link>
        {secondary ? (
          <span className="commercial-cta-secondary">
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </span>
        ) : null}
      </p>
    </MonetizationShell>
  );
}

export function AffiliateReferralLinks({
  title,
  intro,
  partners,
}: Extract<ResolvedMonetizationBlock, { kind: "affiliate-links" }>) {
  if (partners.length === 0) return null;

  return (
    <MonetizationShell label="Related offers" title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{intro}</p>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
        {partners.map((partner) => (
          <li key={partner.id}>
            <TrackLink
              href={partner.href}
              eventName="offer_click"
              payload={{ offerId: partner.id }}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
              className="commercial-cta-primary"
            >
              {partner.headline}
            </TrackLink>
            {partner.description ? <span className="commercial-cta-secondary"> — {partner.description}</span> : ""}
          </li>
        ))}
      </ul>
      <DisclosureNote variant="affiliate" />
    </MonetizationShell>
  );
}
