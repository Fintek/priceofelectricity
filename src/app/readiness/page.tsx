import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Production Readiness | PriceOfElectricity.com",
  description:
    "Automated production readiness audit for PriceOfElectricity.com covering availability, SEO, security, and API contract checks.",
  alternates: { canonical: `${BASE_URL}/readiness` },
  openGraph: {
    title: "Production Readiness | PriceOfElectricity.com",
    description:
      "Automated production readiness audit for PriceOfElectricity.com.",
    url: `${BASE_URL}/readiness`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Production Readiness | PriceOfElectricity.com",
    description:
      "Automated production readiness audit for PriceOfElectricity.com.",
  },
};

type CheckResult = {
  name: string;
  passed: boolean;
  details?: string;
};

type ReadinessReport = {
  generatedAt: string;
  commit: string;
  summary: { total: number; passed: number; failed: number };
  checks: CheckResult[];
};

async function getReport(): Promise<ReadinessReport | null> {
  try {
    const raw = await readFile(
      join(process.cwd(), "public", "readiness.json"),
      "utf8",
    );
    return JSON.parse(raw) as ReadinessReport;
  } catch {
    return null;
  }
}

export default async function ReadinessPage() {
  const report = await getReport();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Production Readiness",
    url: `${BASE_URL}/readiness`,
    description:
      "Automated production readiness audit for PriceOfElectricity.com.",
  };

  if (!report) {
    return (
      <main className="container">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <h1>Production Readiness</h1>
        <p className="intro muted" style={{ marginTop: 0 }}>
          Audit not generated yet. Run{" "}
          <code>npm run readiness:audit</code> to generate.
        </p>
      </main>
    );
  }

  const allPassed = report.summary.failed === 0;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1>Production Readiness</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Automated audit of availability, SEO, security, and API contract
        checks. Generated {report.generatedAt} (commit{" "}
        <code>{report.commit}</code>).
      </p>

      {!allPassed && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 24,
            color: "#991b1b",
          }}
        >
          <strong>
            {report.summary.failed} check
            {report.summary.failed !== 1 ? "s" : ""} failed.
          </strong>{" "}
          Review the table below for details.
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          Summary: {report.summary.passed} / {report.summary.total} checks
          passed
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 12,
            fontSize: 14,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #e5e7eb",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "8px 12px", width: 40 }}></th>
              <th style={{ padding: "8px 12px" }}>Check</th>
              <th style={{ padding: "8px 12px" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {report.checks.map((check, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: check.passed ? undefined : "#fef2f2",
                }}
              >
                <td
                  style={{
                    padding: "6px 12px",
                    textAlign: "center",
                    fontSize: 16,
                  }}
                >
                  {check.passed ? "✓" : "✗"}
                </td>
                <td style={{ padding: "6px 12px" }}>{check.name}</td>
                <td
                  style={{
                    padding: "6px 12px",
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  {check.details ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/status">Status</Link> {" | "}
        <Link href="/health">Health</Link> {" | "}
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/api-docs">API Docs</Link>
      </p>
    </main>
  );
}
