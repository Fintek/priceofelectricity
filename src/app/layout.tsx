import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL, LAUNCH_MODE } from "@/lib/site";
import { reportWebVitals as reportWebVitalsImpl } from "@/lib/performance";
import SearchBox from "@/app/components/SearchBox";
import PreferredStateBanner from "@/app/components/PreferredStateBanner";
import { STATES } from "@/data/states";
import { getCurrentSnapshot } from "@/lib/snapshotLoader";

const BASE_URL = SITE_URL;
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `Average Electricity Prices by State | ${SITE_NAME}`,
    template: "%s",
  },
  description:
    "Compare average residential electricity prices by state, estimate monthly bills, and track rate changes across the United States.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
  },
};

export function reportWebVitals(metric: Parameters<typeof reportWebVitalsImpl>[0]) {
  reportWebVitalsImpl(metric);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
  };
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="priceofelectricity.com"
          src="https://plausible.io/js/script.js"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
      </head>
      <body className={inter.variable} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        {!LAUNCH_MODE && (
          <div
            style={{
              background: "#fef3c7",
              borderBottom: "1px solid #fcd34d",
              padding: "6px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "#92400e",
            }}
          >
            Pre-launch mode —{" "}
            <Link href="/launch-checklist" style={{ color: "#92400e", textDecoration: "underline" }}>
              View checklist
            </Link>
          </div>
        )}

        <header className="site-header">
          <nav
            className="header-nav container"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <Link href="/" className="site-title-link">
              {SITE_NAME}
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SearchBox />
              <Link href="/about" className="chip" style={{ marginLeft: 0 }}>
                Trust & Methodology
              </Link>
            </div>
          </nav>
        </header>

        <PreferredStateBanner
          statesMap={Object.fromEntries(
            Object.entries(STATES).map(([k, v]) => [k, v.name])
          )}
        />

        <div id="main" style={{ flex: "1 0 auto", minHeight: "calc(100vh - 140px)" }}>
          {children}
        </div>
        <footer className="site-footer">
          <div className="container footer-links">
            <Link href="/about">About</Link> <span>|</span>{" "}
            <Link href="/compare">Compare</Link> <span>|</span>{" "}
            <Link href="/calculator">Calculator</Link> <span>|</span>{" "}
            <Link href="/changelog">Changelog</Link> <span>|</span>{" "}
            <Link href="/contact">Contact</Link> <span>|</span>{" "}
            <Link href="/newsletter">Newsletter</Link> <span>|</span>{" "}
            <Link href="/data-policy">Data Policy</Link> <span>|</span>{" "}
            <Link href="/performance">Performance</Link> <span>|</span>{" "}
            <Link href="/licensing">Licensing</Link> <span>|</span>{" "}
            <Link href="/api-docs">API</Link> <span>|</span>{" "}
            <Link href="/status">Status</Link> <span>|</span>{" "}
            <Link href="/datasets">Data</Link> <span>|</span>{" "}
            <Link href="/press">Press</Link> <span>|</span>{" "}
            <Link href="/research">Research</Link> <span>|</span>{" "}
            <Link href="/methodology">Methodology</Link> <span>|</span>{" "}
            <Link href="/offers">Offers</Link> <span>|</span>{" "}
            <Link href="/disclosures">Disclosures</Link> <span>|</span>{" "}
            <Link href="/regulatory">Regulatory</Link> <span>|</span>{" "}
            <Link href="/regulatory/queue">Regulatory Queue</Link> <span>|</span>{" "}
            <Link href="/alerts">Alerts</Link> <span>|</span>{" "}
            <Link href="/knowledge">Knowledge</Link> <span>|</span>{" "}
            <Link href="/knowledge.json" prefetch={false}>Knowledge JSON</Link> <span>|</span>{" "}
            <Link href="/registry.json" prefetch={false}>Registry</Link> <span>|</span>{" "}
            <Link href="/graph.json" prefetch={false}>Graph</Link> <span>|</span>{" "}
            <Link href="/data-history">Data History</Link> <span>|</span>{" "}
            <Link href="/v/ai-energy">AI &amp; Energy</Link> <span>|</span>{" "}
            <Link href="/drivers">Price Drivers</Link> <span>|</span>{" "}
            <Link href="/citations">Citations</Link> <span>|</span>{" "}
            <Link href="/press-kit">Press Kit</Link> <span>|</span>{" "}
            <Link href="/attribution">Attribution</Link> <span>|</span>{" "}
            <Link href="/index">Site Index</Link>
          </div>
          <div className="container muted" style={{ textAlign: "center", fontSize: 11, paddingTop: 6, opacity: 0.7 }}>
            Admin:{" "}
            <Link href="/launch-checklist">Checklist</Link> {" | "}
            <Link href="/metrics">Metrics</Link> {" | "}
            <Link href="/submit-urls">Submit URLs</Link> {" | "}
            <Link href="/readiness">Readiness</Link> {" | "}
            <Link href="/revenue">Revenue</Link>
          </div>
          <div className="container muted" style={{ textAlign: "center", fontSize: 12, paddingTop: 4, paddingBottom: 8 }}>
            Data version: {getCurrentSnapshot().version}
          </div>
        </footer>
      </body>
    </html>
  );
}