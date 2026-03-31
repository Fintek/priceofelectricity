import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  BILL_ESTIMATOR_PROFILES,
  getActiveBillEstimatorProfilePages,
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
    "Estimate your monthly electricity bill based on household size and usage patterns. Choose your state and household profile to see personalized cost estimates.",
  canonicalPath: "/electricity-bill-estimator",
});

export default async function ElectricityBillEstimatorHubPage() {
  const states = await loadAllBillEstimatorStateSummaries();
  const representativeState = sortAverageBillStates(states, "asc")[Math.floor(states.length / 2)];
  if (!representativeState) {
    return null;
  }
  const profileRows = buildBillEstimatorProfileRows(representativeState);
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

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Bill Estimator</h1>
        <p style={{ marginTop: 0, marginBottom: 20, maxWidth: "65ch", lineHeight: 1.7 }}>
          Estimate your monthly electricity bill based on your household size and typical usage.
          Select your state below to see personalized estimates, or choose a household profile to
          compare costs across different living situations.
        </p>

        {/* ── QUICK CHOICES ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Choose how to estimate</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Link href="/electricity-cost-calculator" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Custom Calculator</div>
              <div className="stat-card-label">Enter any kWh amount</div>
            </Link>
            <Link href="/average-electricity-bill" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Average Bills</div>
              <div className="stat-card-label">See typical bills at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh</div>
            </Link>
            <Link href="/electricity-cost-comparison" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Compare States</div>
              <div className="stat-card-label">Side-by-side cost comparison</div>
            </Link>
          </div>
        </section>

        {/* ── HOUSEHOLD PROFILES ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Household profiles</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>
            Each profile uses a typical monthly usage based on household size. Estimates are energy-only
            and exclude delivery fees, taxes, and fixed charges.
          </p>
          <div className="stat-panel">
            {BILL_ESTIMATOR_PROFILES.map((profile) => (
              <div key={profile.slug} className="stat-card">
                <div className="stat-card-value">{profile.defaultMonthlyKwh.toLocaleString()}</div>
                <div className="stat-card-label">kWh/mo — {profile.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── EXAMPLE TABLE ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            Example estimates: {representativeState.name} ({formatRate(representativeState.avgRateCentsPerKwh)})
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--color-border, #e5e7eb)" }}>
              <thead>
                <tr>
                  {["Profile", "Monthly usage", "Est. monthly bill"].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)", backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileRows.map((row) => (
                  <tr key={row.profile.slug}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.profile.label}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.profile.defaultMonthlyKwh.toLocaleString()} kWh</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{formatUsd(row.monthlyCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── STATE GRID ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Estimate by state</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/electricity-bill-estimator/${state.slug}`}
                className="stat-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ fontWeight: 500 }}>{state.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  ~{formatUsd(state.monthlyBill)}/mo at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── PROFILE SCENARIOS (if active) ── */}
        {activeProfileGroups.size > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Household scenario pages</h2>
            <p className="muted" style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 13 }}>
              Detailed scenario estimates are available for select states and household profiles.
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
                          {profile.replace(/-/g, " ")}
                        </Link>
                      </span>
                    ))}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ── RELATED TOOLS ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related tools</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/average-electricity-bill">Average electricity bills by state</Link></li>
            <li><Link href="/electricity-cost-calculator">Custom electricity cost calculator</Link></li>
            <li><Link href="/electricity-cost-comparison">Compare electricity costs between states</Link></li>
            <li><Link href="/energy-comparison">Energy comparison hub</Link></li>
            <li><Link href="/cost-to-run/refrigerator/texas">Appliance running cost estimates</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
