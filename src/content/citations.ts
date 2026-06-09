export type Citation = {
  id: string;
  title: string;
  publication: string;
  date: string;
  url?: string;
  context: string;
  isPlaceholder?: boolean;
};

// Citations are added manually as real media mentions are verified. The list is
// intentionally empty until then; the citations page renders an honest
// "No verified citations yet" state while it is empty. The `isPlaceholder`
// field and filters below remain so unverified drafts can be staged without
// rendering.
export const CITATIONS: Citation[] = [];

export function getVerifiedCitations(): Citation[] {
  return CITATIONS.filter((c) => !c.isPlaceholder);
}

export function getSortedCitations(): Citation[] {
  return [...CITATIONS].sort((a, b) => b.date.localeCompare(a.date));
}
