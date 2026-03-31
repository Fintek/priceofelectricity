import DisclosureNote from "@/app/components/DisclosureNote";

export default function CommercialComplianceNote({
  hasAffiliateOffer,
}: {
  hasAffiliateOffer: boolean;
}) {
  return (
    <div className="commercial-module-compliance">
      <DisclosureNote variant={hasAffiliateOffer ? "affiliate" : "general"} />
    </div>
  );
}
