import { STATE_LIST, STATES } from "@/data/states";

export type PublicStateDestination = {
  label: string;
  href: string;
};

export type HomepageCoverageEntry = {
  slug: string;
  label: string;
  href: string;
  avgRateCentsPerKwh: number;
};

export function getPublicStateDestination(slug: string): PublicStateDestination {
  const state = STATES[slug];

  if (state) {
    return {
      label: state.name,
      href: `/${slug}`,
    };
  }

  if (slug === "district-of-columbia") {
    return {
      label: "District of Columbia",
      href: "/knowledge/state/district-of-columbia",
    };
  }

  return {
    label: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    href: `/knowledge/state/${slug}`,
  };
}

export function getHomepageCoverageEntries(): HomepageCoverageEntry[] {
  return STATE_LIST.map((state) => ({
    slug: state.slug,
    label: state.name,
    href: `/${state.slug}`,
    avgRateCentsPerKwh: state.avgRateCentsPerKwh,
  })).sort((left, right) => left.label.localeCompare(right.label));
}
