import assert from "node:assert/strict";
import test from "node:test";
import {
  getHomepageCoverageEntries,
  getPublicStateDestination,
} from "@/lib/stateDestinations";

test("uses state overview routes for the 51-jurisdiction dataset", () => {
  assert.deepEqual(getPublicStateDestination("texas"), {
    href: "/texas",
    label: "Texas",
  });
});

test("routes district of columbia to its canonical state page", () => {
  assert.deepEqual(getPublicStateDestination("district-of-columbia"), {
    href: "/district-of-columbia",
    label: "District of Columbia",
  });
});

test("includes district of columbia in homepage coverage entries", () => {
  const entries = getHomepageCoverageEntries();
  const dcEntry = entries.find((entry) => entry.slug === "district-of-columbia");

  assert.ok(dcEntry, "DC should appear in homepage state list");
  assert.equal(dcEntry?.href, "/district-of-columbia");
});

test("homepage coverage entries only contain jurisdictions with rate data", () => {
  const entries = getHomepageCoverageEntries();

  assert.equal(entries.length, 51);
  for (const entry of entries) {
    assert.equal(typeof entry.avgRateCentsPerKwh, "number", `${entry.slug} should have numeric rate`);
  }
});
