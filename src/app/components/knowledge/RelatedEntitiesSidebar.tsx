import Link from "next/link";
import { t } from "@/lib/knowledge/labels";

export type EntityRef = {
  type: string;
  slug: string;
  label: string;
  href: string;
};

type RelatedEntitiesSidebarProps = {
  states?: EntityRef[];
  rankings?: EntityRef[];
  methodologies?: EntityRef[];
  verticals?: EntityRef[];
  national?: boolean;
};

export default function RelatedEntitiesSidebar({
  states = [],
  rankings = [],
  methodologies = [],
  verticals = [],
  national = false,
}: RelatedEntitiesSidebarProps) {
  const hasAny =
    states.length > 0 ||
    rankings.length > 0 ||
    methodologies.length > 0 ||
    verticals.length > 0 ||
    national;

  if (!hasAny) return null;

  return (
    <aside
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        backgroundColor: "#fafafa",
      }}
    >
      <h3 style={{ fontSize: 16, margin: "0 0 12px 0" }}>{t("section.relatedEntitiesTitle")}</h3>
      {national && (
        <section style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            {t("entity.national")}
          </strong>
          <Link href="/national">{t("entity.nationalOverview")}</Link>
        </section>
      )}
      {states.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            States
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {states.map((s) => (
              <li key={s.slug}>
                <Link href={s.href}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {rankings.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            {t("entity.rankings")}
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {rankings.map((r) => (
              <li key={r.slug}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {methodologies.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            Methodologies
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {methodologies.map((m) => (
              <li key={m.slug}>
                <Link href={m.href}>{m.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {verticals.length > 0 && (
        <section>
          <strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            {t("entity.verticals")}
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {verticals.map((v) => (
              <li key={v.slug}>
                <Link href={v.href}>{v.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
