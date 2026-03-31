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
    <p className="muted" style={{ fontSize: "inherit", marginTop: 8, marginBottom: 4 }}>
      {text}{" "}
      <Link href="/disclosures">Read our disclosures</Link>.
    </p>
  );
}
