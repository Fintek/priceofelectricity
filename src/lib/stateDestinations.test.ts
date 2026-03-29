import assert from "node:assert/strict";
import test from "node:test";
import {
  getHomepageCoverageEntries,
  getPublicStateDestination,
} from "@/lib/stateDestinations";

test("uses state overview routes for the 50-state dataset", () => {
  assert.deepEqual(getPublicStateDestination("texas"), {
    href: "/texas",
    label: "Texas",
  });
});

test("routes district of columbia to its supported public destination", () => {
  assert.deepEqual(getPublicStateDestination("district-of-columbia"), {
    href: "/knowledge/state/district-of-columbia",
    label: "District of Columbia",
  });
});

test("includes district of columbia in homepage coverage entries", () => {
  const entries = getHomepageCoverageEntries();
  const dcEntry = entries.find((entry) => entry.slug === "district-of-columbia");

  assert.ok(dcEntry, "expected homepage coverage entries to include District of Columbia");
  assert.equal(dcEntry?.href, "/knowledge/state/district-of-columbia");
});
