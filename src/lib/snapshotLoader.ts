import v2Data from "@/data/snapshots/v2.json";

export type SnapshotState = {
  slug: string;
  rate: number;
  updated: string;
};

export type Snapshot = {
  version: string;
  releasedAt: string;
  states: SnapshotState[];
};

export type SnapshotDelta = {
  slug: string;
  oldRate: number;
  newRate: number;
  delta: number;
};

const SNAPSHOTS: Snapshot[] = [v2Data as Snapshot];

export function getAllSnapshots(): Snapshot[] {
  return SNAPSHOTS;
}

export function getSnapshotVersions(): string[] {
  return SNAPSHOTS.map((s) => s.version);
}

export function getSnapshot(version: string): Snapshot | undefined {
  return SNAPSHOTS.find((s) => s.version === version);
}

export function getCurrentSnapshot(): Snapshot {
  return SNAPSHOTS[SNAPSHOTS.length - 1];
}

export function compareSnapshots(
  oldVersion: string,
  newVersion: string
): SnapshotDelta[] | null {
  const oldSnap = getSnapshot(oldVersion);
  const newSnap = getSnapshot(newVersion);
  if (!oldSnap || !newSnap) return null;

  const oldMap = new Map(oldSnap.states.map((s) => [s.slug, s.rate]));

  return newSnap.states
    .map((ns) => {
      const oldRate = oldMap.get(ns.slug);
      if (oldRate === undefined) return null;
      return {
        slug: ns.slug,
        oldRate,
        newRate: ns.rate,
        delta: Math.round((ns.rate - oldRate) * 100) / 100,
      };
    })
    .filter((d): d is SnapshotDelta => d !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
