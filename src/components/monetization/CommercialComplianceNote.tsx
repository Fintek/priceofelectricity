import DisclosureNote from "@/app/components/DisclosureNote";

export default function CommercialComplianceNote({
  hasAffiliateOffer,
}: {
  hasAffiliateOffer: boolean;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
        Commercial context: partner placements may appear here to support provider discovery. These placements are
        optional, informational, and do not imply utility, government, or regulator affiliation.
      </p>
      <DisclosureNote variant={hasAffiliateOffer ? "affiliate" : "general"} />
    </div>
  );
}
