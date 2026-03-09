import { loadDisclaimers } from "@/lib/knowledge/loadKnowledgePage";
import DisclaimerBlock from "@/components/policy/DisclaimerBlock";
import Section from "@/components/common/Section";

type DisclaimersProps = {
  disclaimerRefs: string[];
  defaultCollapsed?: boolean;
};

export default async function Disclaimers({ disclaimerRefs, defaultCollapsed = true }: DisclaimersProps) {
  if (!disclaimerRefs || disclaimerRefs.length === 0) return null;

  const policy = await loadDisclaimers();
  if (!policy?.disclaimers) return null;

  const byId = new Map(policy.disclaimers.map((d) => [d.id, d]));
  const ids = disclaimerRefs.filter((id) => byId.has(id));
  if (ids.length === 0) return null;

  return (
    <Section title="Disclaimers">
      {ids.map((id) => (
        <DisclaimerBlock
          key={id}
          disclaimerId={id}
          policy={policy}
          defaultCollapsed={defaultCollapsed}
        />
      ))}
    </Section>
  );
}
