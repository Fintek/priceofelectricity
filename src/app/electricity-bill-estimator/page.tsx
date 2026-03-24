import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  BILL_ESTIMATOR_PROFILES,
  getActiveBillEstimatorProfilePages,
  getBillEstimatorProfileRolloutSummary,
  buildBillEstimatorProfileRows,
  loadAllBillEstimatorStateSummaries,
} from "@/lib/longtail/billEstimator";
import { AVERAGE_ELECTRICITY_BILL_USAGE_KWH, sortAverageBillStates } from "@/lib/longtail/averageBill";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Bill Estimator by Household Profile | PriceOfElectricity.com",
  description:
    "Deterministic electricity bill estimator pages by household profile and state. Compare profile scenarios and connect to benchmark, calculator, and fixed-kWh canonical routes.",
  canonicalPath: "/electricity-bill-estimator",
});

export default async function ElectricityBillEstimatorHubPage() {
  const states = await loadAllBillEstimatorStateSummaries();
  const representativeState = sortAverageBillStates(states, "asc")[Math.floor(states.length / 2)];
  if (!representativeState) {
    return null;
  }
  const profileRows = buildBillEstimatorProfileRows(representativeState);
  const profileRollout = getBillEstimatorProfileRolloutSummary();
  const activeProfileGroups = new Map<string, string[]>();
  for (const entry of getActiveBillEstimatorProfilePages()) {
    const rows = activeProfileGroups.get(entry.slug) ?? [];
    rows.push(entry.profile);
    activeProfileGroups.set(entry.slug, rows);
  }

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Bill Estimator", url: "/electricity-bill-estimator" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Bill Estimator",
    description:
      "Household-profile electricity bill estimator hub that links to state and profile scenario pages.",
    url: "/electricity-bill-estimator",
    isPartOf: "/",
    about: ["electric bill estimator", "household electricity cost scenarios"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <span aria-current="page">Electricity Bill Estimator</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Bill Estimator by Household Profile</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "75ch", lineHeight: 1.7 }}>
          This estimator family is designed for household-profile scenario intent. It is distinct from the benchmark
          average-bill family and distinct from the open-ended calculator family.
        </p>
        <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: "75ch" }}>
          Trust boundary: profile routes are rollout-gated and currently limited to {profileRollout.activeKeyCount}{" "}
          explicit pilot keys across {profileRollout.activeStateCount} states (
          {profileRollout.activeStateSlugs.map((slug) => slug.replace(/-/g, " ")).join(", ")}), while this hub and
          state estimator pages remain the canonical owner for broad estimator discovery intent.
        </p>
        <ul style={{ marginTop: 0, marginBottom: 24, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <strong>Benchmark intent:</strong> <Link href="/average-electricity-bill">/average-electricity-bill</Link>{" "}
            uses a fixed {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh reference.
          </li>
          <li>
            <strong>Calculator intent:</strong> <Link href="/electricity-cost-calculator">/electricity-cost-calculator</Link>{" "}
            supports broad custom usage pathways.
          </li>
          <li>
            <strong>Estimator intent:</strong> this family uses deterministic household profiles with auditable usage
            assumptions.
          </li>
        </ul>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Profile assumptions in scope</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {BILL_ESTIMATOR_PROFILES.map((profile) => (
              <li key={profile.slug}>
                <strong>{profile.label}:</strong> {profile.defaultMonthlyKwh.toLocaleString()} kWh/month{" "}
                <span className="muted">
                  (range {profile.monthlyKwhRange.low.toLocaleString()}-{profile.monthlyKwhRange.high.toLocaleString()} kWh)
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            Example profile estimates in {representativeState.name}
          </h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            State rate used in this example: {formatRate(representativeState.avgRateCentsPerKwh)}.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid var(--color-border, #e5e7eb)",
              }}
            >
              <thead>
                <tr>
                  {["Profile", "Monthly usage", "Estimated monthly bill", "Scenario profile"].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderBottom: "1px solid var(--color-border, #e5e7eb)",
                        backgroundColor: "var(--color-surface-alt, #f9fafb)",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileRows.map((row) => (
                  <tr key={row.profile.slug}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.profile.label}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.profile.defaultMonthlyKwh.toLocaleString()} kWh
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.monthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.profile.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State estimator pages</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/electricity-bill-estimator/${state.slug}`}
                style={{
                  display: "block",
                  padding: 14,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {state.name}
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {formatUsd(state.monthlyBill)} at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh benchmark
                </div>
              </Link>
            ))}
          </div>
        </section>

        {activeProfileGroups.size > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Live profile pilot pathways</h2>
            <p className="muted" style={{ marginTop: 0, marginBottom: 12, maxWidth: "75ch" }}>
              Profile-page discovery is intentionally limited to the explicit allowlist below ({profileRollout.activeKeyCount}{" "}
              routes across {profileRollout.activeStateCount} states). All other state-profile routes remain
              rollout-deferred.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {Array.from(activeProfileGroups.entries()).map(([stateSlug, profiles]) => {
                const stateName = states.find((state) => state.slug === stateSlug)?.name ?? stateSlug;
                return (
                  <li key={stateSlug}>
                    <strong>{stateName}:</strong>{" "}
                    {profiles.map((profile, index) => (
                      <span key={`${stateSlug}-${profile}`}>
                        {index > 0 ? " · " : ""}
                        <Link href={`/electricity-bill-estimator/${stateSlug}/${profile}`}>
                          {profile.replace(/-/g, " ")} scenario
                        </Link>
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Next-step pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/average-electricity-bill">Average bill benchmark cluster</Link>
              {" — "}
              Fixed benchmark intent for state-level bill comparisons
            </li>
            <li>
              <Link href="/electricity-cost-calculator">Electricity cost calculator cluster</Link>
              {" — "}
              Custom scenario intent beyond fixed household profiles
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison cluster</Link>
              {" — "}
              State-vs-state rate and bill comparison intent
            </li>
            <li>
              <Link href="/energy-comparison">Energy comparison hub</Link>
              {" — "}
              Curated discovery across comparison, usage, appliance, and estimator pathways
            </li>
            <li>
              <Link href="/cost-to-run/refrigerator/texas">Appliance operating-cost cluster</Link>
              {" — "}
              Appliance intent pages linked to calculator and state context
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
