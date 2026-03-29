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

test("routes district of columbia to its knowledge destination", () => {
  assert.deepEqual(getPublicStateDestination("district-of-columbia"), {
    href: "/knowledge/state/district-of-columbia",
    label: "District of Columbia",
  });
});

test("excludes district of columbia from homepage coverage entries", () => {
  const entries = getHomepageCoverageEntries();
  const dcEntry = entries.find((entry) => entry.slug === "district-of-columbia");

  assert.equal(dcEntry, undefined, "DC should not appear in homepage state list");
});

test("homepage coverage entries only contain states with rate data", () => {
  const entries = getHomepageCoverageEntries();

  assert.equal(entries.length, 50);
  for (const entry of entries) {
    assert.equal(typeof entry.avgRateCentsPerKwh, "number", `${entry.slug} should have numeric rate`);
  }
});
