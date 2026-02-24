import Link from "next/link";

type DisclosureVariant = "affiliate" | "general";

export default function DisclosureNote({
  variant = "general",
}: {
  variant?: DisclosureVariant;
}) {
  const text =
    variant === "affiliate"
      ? "Disclosure: Some links may be referral links."
      : "Disclosure: This page may include referral links and summary estimates.";

  return (
    <p className="muted" style={{ fontSize: 13, marginTop: 10, marginBottom: 10 }}>
      {text}{" "}
      <Link href="/disclosures">Read our disclosures</Link>.
    </p>
  );
}
