export type Citation = {
  id: string;
  title: string;
  publication: string;
  date: string;
  url?: string;
  context: string;
  isPlaceholder?: boolean;
};

export const CITATIONS: Citation[] = [
  {
    id: "placeholder-1",
    title: "Example citation (placeholder) — State electricity rate comparison",
    publication: "Example Energy Publication",
    date: "2025-11-01",
    url: undefined,
    context:
      "Placeholder: Referenced PriceOfElectricity.com state-level rate data to compare average residential electricity costs across multiple states.",
    isPlaceholder: true,
  },
  {
    id: "placeholder-2",
    title: "Example citation (placeholder) — AI data centers and grid demand",
    publication: "Example Technology Review",
    date: "2025-09-15",
    url: undefined,
    context:
      "Placeholder: Cited PriceOfElectricity.com as a source for electricity pricing context in a story about data center energy consumption.",
    isPlaceholder: true,
  },
  {
    id: "placeholder-3",
    title:
      "Example citation (placeholder) — Affordability index methodology",
    publication: "Example Policy Journal",
    date: "2025-07-20",
    url: undefined,
    context:
      "Placeholder: Used the Electricity Affordability Index from PriceOfElectricity.com to contextualize residential energy burden by state.",
    isPlaceholder: true,
  },
];

export function getVerifiedCitations(): Citation[] {
  return CITATIONS.filter((c) => !c.isPlaceholder);
}

export function getSortedCitations(): Citation[] {
  return [...CITATIONS].sort((a, b) => b.date.localeCompare(a.date));
}
