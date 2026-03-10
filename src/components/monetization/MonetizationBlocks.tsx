import Link from "next/link";
import DisclosureNote from "@/app/components/DisclosureNote";
import TrackLink from "@/app/components/TrackLink";
import type { ResolvedMonetizationBlock, ResolvedPartnerLink } from "@/lib/monetization/resolve";

function MonetizationShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 32,
        padding: 20,
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt, #f9fafb)",
      }}
    >
      <h2 style={{ fontSize: 20, marginTop: 0, marginBottom: 12 }}>{title}</h2>
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
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              {partner.name}
            </div>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{partner.headline}</div>
            <PartnerBadges badges={partner.badges} />
            <p style={{ marginTop: 0, marginBottom: 12, lineHeight: 1.6 }}>{partner.description}</p>
            <TrackLink
              href={partner.href}
              eventName="offer_click"
              payload={{ offerId: partner.id }}
              target="_blank"
              rel="sponsored nofollow noopener noreferrer"
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
    <MonetizationShell title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} style={{ fontWeight: 600 }}>
          {primary.label}
        </Link>
        {secondary ? (
          <>
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </>
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
    <MonetizationShell title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} style={{ fontWeight: 600 }}>
          {primary.label}
        </Link>
        {secondary ? (
          <>
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </>
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
    <MonetizationShell title={title}>
      <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: 0 }}>
        <Link href={primary.href} style={{ fontWeight: 600 }}>
          {primary.label}
        </Link>
        {secondary ? (
          <>
            {" · "}
            <Link href={secondary.href}>{secondary.label}</Link>
          </>
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
    <MonetizationShell title={title}>
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
            >
              {partner.headline}
            </TrackLink>
            {partner.description ? ` — ${partner.description}` : ""}
          </li>
        ))}
      </ul>
      <DisclosureNote variant="affiliate" />
    </MonetizationShell>
  );
}
