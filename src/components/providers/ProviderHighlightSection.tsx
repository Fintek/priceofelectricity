import ProviderCards from "@/components/providers/ProviderCards";
import type { ResolvedProvider } from "@/lib/providers/resolve";

export default function ProviderHighlightSection({
  title,
  intro,
  providers,
  emptyMessage,
}: {
  title: string;
  intro: string;
  providers: ResolvedProvider[];
  emptyMessage?: string;
}) {
  if (providers.length === 0) {
    return emptyMessage ? (
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
        <p className="muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          {emptyMessage}
        </p>
      </section>
    ) : null;
  }

  return <ProviderCards title={title} intro={intro} providers={providers} />;
}
