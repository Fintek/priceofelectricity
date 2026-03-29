import assert from "node:assert/strict";
import test from "node:test";
import { getAllSnapshots, getCurrentSnapshot } from "@/lib/snapshotLoader";

test("uses the newest released snapshot as current", () => {
  const snapshots = getAllSnapshots();

  assert.ok(snapshots.length >= 2, "expected at least two snapshots for history and current coverage");

  const releaseDates = snapshots.map((snapshot) => snapshot.releasedAt);
  const sortedReleaseDates = [...releaseDates].sort();

  assert.deepEqual(releaseDates, sortedReleaseDates);
  assert.equal(getCurrentSnapshot().releasedAt, sortedReleaseDates.at(-1));
});
