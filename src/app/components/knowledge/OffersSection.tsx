type Offer = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  enabled: boolean;
};

type OffersSectionProps = {
  offers: Offer[];
  disclaimer: string;
};

export default function OffersSection({ offers, disclaimer }: OffersSectionProps) {
  if (offers.length === 0) return null;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        backgroundColor: "var(--color-surface-alt)",
      }}
    >
      <h2 style={{ fontSize: 18, margin: "0 0 12px 0" }}>Offers</h2>
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
        {offers.map((offer) => (
          <li key={offer.id}>
            {offer.url ? (
              <a href={offer.url} target="_blank" rel="noopener noreferrer">
                {offer.title}
              </a>
            ) : (
              <span>{offer.title}</span>
            )}
            {offer.description && (
              <span className="muted" style={{ display: "block", fontSize: 14 }}>
                {offer.description}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="muted" style={{ margin: "12px 0 0 0", fontSize: 13 }}>
        {disclaimer}
      </p>
    </section>
  );
}
