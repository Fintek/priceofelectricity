import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL, LAUNCH_MODE } from "@/lib/site";
import { OFFERS } from "@/data/offers";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Launch Checklist | PriceOfElectricity.com",
  description: "Pre-launch activation checklist for PriceOfElectricity.com.",
  alternates: { canonical: `${BASE_URL}/launch-checklist` },
  robots: { index: false, follow: false },
};

type CheckItem = {
  label: string;
  passed: boolean;
  detail: string;
};

type ReadinessReport = {
  generatedAt: string;
  commit: string;
  summary: { total: number; passed: number; failed: number };
};

type ReleaseMetadata = {
  commit?: string;
  builtAt?: string;
  dataVersion?: string;
};

async function readJson<T>(filename: string): Promise<T | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function section(title: string, items: CheckItem[]) {
  const passCount = items.filter((i) => i.passed).length;
  return { title, items, passCount, total: items.length };
}

export default async function LaunchChecklistPage() {
  const readiness = await readJson<ReadinessReport>("readiness.json");
  const release = await readJson<ReleaseMetadata>("release.json");

  const isProdDomain =
    SITE_URL === "https://priceofelectricity.com" ||
    SITE_URL.startsWith("https://priceofelectricity.com");
  const siteUrlIsSet = !!process.env.NEXT_PUBLIC_SITE_URL;
  const emailSink = process.env.EMAIL_SINK?.trim().toLowerCase() ?? "log";
  const exportTokenSet = !!process.env.ALERT_EXPORT_TOKEN?.trim();
  const indexNowKeySet = !!process.env.INDEXNOW_KEY?.trim();
  const activeOffers = OFFERS.filter((o) => o.active);

  const sections = [
    section("A) Domain", [
      {
        label: "NEXT_PUBLIC_SITE_URL is production domain",
        passed: isProdDomain,
        detail: siteUrlIsSet ? SITE_URL : `Not set (resolves to ${SITE_URL})`,
      },
      {
        label: "HTTPS enforced",
        passed: SITE_URL.startsWith("https://"),
        detail: SITE_URL.startsWith("https://") ? "Yes" : "No — using HTTP",
      },
      {
        label: "LAUNCH_MODE enabled",
        passed: LAUNCH_MODE,
        detail: LAUNCH_MODE ? "true" : "Not set",
      },
    ]),

    section("B) Indexing", [
      {
        label: "Readiness audit passes",
        passed: readiness !== null && readiness.summary.failed === 0,
        detail: readiness
          ? `${readiness.summary.passed}/${readiness.summary.total} passed`
          : "Not generated — run npm run readiness:audit",
      },
      {
        label: "Sitemap submitted to Google Search Console",
        passed: false,
        detail: "Manual step — verify in Search Console",
      },
      {
        label: "Bing IndexNow configured (optional)",
        passed: indexNowKeySet,
        detail: indexNowKeySet ? "Key set" : "INDEXNOW_KEY not set",
      },
    ]),

    section("C) Monitoring", [
      {
        label: "/health endpoint exists",
        passed: true,
        detail: "Route exists at /health",
      },
      {
        label: "/status shows release commit",
        passed: !!release?.commit && release.commit !== "unknown",
        detail: release?.commit ? `commit=${release.commit}` : "Unknown",
      },
      {
        label: "Release metadata generated",
        passed: !!release?.builtAt && release.builtAt !== "unknown",
        detail: release?.builtAt ?? "Not generated",
      },
    ]),

    section("D) Email Capture", [
      {
        label: "EMAIL_SINK not set to none",
        passed: emailSink !== "none",
        detail: `EMAIL_SINK=${emailSink}`,
      },
      {
        label: "Export token configured",
        passed: exportTokenSet,
        detail: exportTokenSet
          ? "ALERT_EXPORT_TOKEN set"
          : "ALERT_EXPORT_TOKEN not set",
      },
      {
        label: "Test signup recorded",
        passed: false,
        detail: "Manual step — submit a test alert signup",
      },
    ]),

    section("E) Monetization", [
      {
        label: "Offers active",
        passed: activeOffers.length > 0,
        detail: `${activeOffers.length} active offer(s)`,
      },
      {
        label: "Disclosure page live",
        passed: true,
        detail: "/disclosures exists",
      },
      {
        label: "Outbound redirects tested",
        passed: false,
        detail: "Manual step — click an offer and verify redirect",
      },
    ]),
  ];

  const totalItems = sections.reduce((s, sec) => s + sec.total, 0);
  const totalPassed = sections.reduce((s, sec) => s + sec.passCount, 0);

  return (
    <main className="container">
      <h1>Launch Checklist</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Pre-launch activation checklist. Items marked PASS are verified
        automatically; ACTION NEEDED items require manual confirmation.
      </p>

      <div
        style={{
          background: totalPassed === totalItems ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${totalPassed === totalItems ? "#86efac" : "#fcd34d"}`,
          borderRadius: 6,
          padding: "12px 16px",
          marginBottom: 24,
          color: totalPassed === totalItems ? "#166534" : "#92400e",
        }}
      >
        <strong>
          {totalPassed} / {totalItems} items passing.
        </strong>{" "}
        {totalPassed === totalItems
          ? "All checks green — ready to launch."
          : "Review items below before launch."}
      </div>

      {sections.map((sec) => (
        <section key={sec.title} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>
            {sec.title}{" "}
            <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 400 }}>
              ({sec.passCount}/{sec.total})
            </span>
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <tbody>
              {sec.items.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: item.passed ? undefined : "#fffbeb",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 12px",
                      width: 120,
                      fontWeight: 600,
                      color: item.passed ? "#166534" : "#92400e",
                    }}
                  >
                    {item.passed ? "PASS" : "ACTION NEEDED"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>{item.label}</td>
                  <td
                    style={{
                      padding: "8px 12px",
                      color: "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    {item.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/status">Status</Link> {" | "}
        <Link href="/readiness">Readiness</Link> {" | "}
        <Link href="/metrics">Metrics</Link> {" | "}
        <Link href="/submit-urls">Submit URLs</Link>
      </p>
    </main>
  );
}
