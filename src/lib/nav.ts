type StateLike = {
  name: string;
  avgRateCentsPerKwh: number;
};

type StateMap<T extends StateLike> = Record<string, T>;

export function getStatesSortedByName<T extends StateLike>(states: StateMap<T>) {
  return Object.entries(states)
    .map(([slug, state]) => ({
      slug,
      name: state.name,
      avgRateCentsPerKwh: state.avgRateCentsPerKwh,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const DC_NEARBY_SLUGS = ["maryland", "virginia"] as const;

export function getBrowseNearbyStates(
  slug: string,
  sortedList: Array<{ slug: string; name: string; avgRateCentsPerKwh: number }>,
): { prev: { slug: string; name: string } | null; next: { slug: string; name: string } | null } {
  if (slug === "district-of-columbia") {
    const bySlug = new Map(sortedList.map((entry) => [entry.slug, entry]));
    const maryland = bySlug.get(DC_NEARBY_SLUGS[0]);
    const virginia = bySlug.get(DC_NEARBY_SLUGS[1]);
    return {
      prev: maryland ? { slug: maryland.slug, name: maryland.name } : null,
      next: virginia ? { slug: virginia.slug, name: virginia.name } : null,
    };
  }
  return getPrevNextByName(slug, sortedList);
}

export function getPrevNextByName(
  slug: string,
  sortedList: Array<{ slug: string; name: string; avgRateCentsPerKwh: number }>
) {
  const index = sortedList.findIndex((entry) => entry.slug === slug);
  if (index === -1) {
    return { prev: null, next: null };
  }

  const prev =
    index > 0
      ? { slug: sortedList[index - 1].slug, name: sortedList[index - 1].name }
      : null;
  const next =
    index < sortedList.length - 1
      ? { slug: sortedList[index + 1].slug, name: sortedList[index + 1].name }
      : null;

  return { prev, next };
}

export function getRelatedByRate<T extends StateLike>(
  slug: string,
  states: StateMap<T>,
  k = 5
) {
  const current = states[slug];
  if (!current) {
    return [];
  }

  return Object.entries(states)
    .filter(([candidateSlug]) => candidateSlug !== slug)
    .map(([candidateSlug, state]) => ({
      slug: candidateSlug,
      name: state.name,
      avgRateCentsPerKwh: state.avgRateCentsPerKwh,
    }))
    .sort((a, b) => {
      const diffA = Math.abs(a.avgRateCentsPerKwh - current.avgRateCentsPerKwh);
      const diffB = Math.abs(b.avgRateCentsPerKwh - current.avgRateCentsPerKwh);
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, k);
}
