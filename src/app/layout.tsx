import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_NAME, SITE_URL, LAUNCH_MODE } from "@/lib/site";
import { reportWebVitals as reportWebVitalsImpl } from "@/lib/performance";
import MobileNav from "@/app/components/MobileNav";
import SearchBox from "@/app/components/SearchBox";
import CommandPalette from "@/components/common/CommandPalette";
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
    sameAs: [],
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
        <link rel="dns-prefetch" href="https://plausible.io" />
        {/* Privacy-friendly analytics by Plausible */}
        <script
          async
          src="https://plausible.io/js/pa-RXARs6-tudW1hny-L8iSK.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()",
          }}
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
          <nav className="header-nav container" aria-label="Main navigation">
            <Link href="/" className="site-title-link">
              {SITE_NAME}
            </Link>

            <div className="header-desktop-nav">
              <Link href="/electricity-cost-comparison">State comparisons</Link>
              <Link href="/energy-comparison">Energy comparison</Link>
              <Link href="/electricity-cost-calculator">Calculator</Link>
              <Link href="/datasets">Data</Link>
              <Link href="/methodology">Methodology</Link>
              <SearchBox />
              <CommandPalette />
            </div>

            <MobileNav />
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
          <div className="container footer-grid">
            <div className="footer-group">
              <p className="footer-group-title">Explore</p>
              <Link href="/electricity-cost-comparison">State comparisons</Link>
              <Link href="/energy-comparison">Energy comparison</Link>
              <Link href="/electricity-cost-calculator">Calculator</Link>
              <Link href="/electricity-bill-estimator">Bill Estimator</Link>
              <Link href="/electricity-cost-comparison">Comparisons</Link>
              <Link href="/electricity-trends">Trends</Link>
              <Link href="/electricity-insights">Insights</Link>
            </div>
            <div className="footer-group">
              <p className="footer-group-title">Data</p>
              <Link href="/datasets">Datasets</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/knowledge">Knowledge</Link>
              <Link href="/research">Research</Link>
              <Link href="/drivers">Price Drivers</Link>
              <Link href="/data-history">Data History</Link>
            </div>
            <div className="footer-group">
              <p className="footer-group-title">About</p>
              <Link href="/about">About &amp; Trust</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/advertise">Advertise with Us</Link>
              <Link href="/newsletter">Newsletter</Link>
              <Link href="/press">Press</Link>
              <Link href="/citations">Citations</Link>
              <Link href="/site-map">Site Map</Link>
            </div>
            <div className="footer-group">
              <p className="footer-group-title">Legal</p>
              <Link href="/data-policy">Data Policy</Link>
              <Link href="/disclosures">Disclosures</Link>
              <Link href="/licensing">Licensing</Link>
              <Link href="/regulatory">Regulatory</Link>
              <Link href="/attribution">Attribution</Link>
              <Link href="/offers">Offers</Link>
            </div>
          </div>
          {process.env.NODE_ENV !== "production" && (
            <div className="container muted" style={{ textAlign: "center", fontSize: 11, paddingTop: 6, opacity: 0.7 }}>
              Admin:{" "}
              <Link href="/launch-checklist">Checklist</Link> {" | "}
              <Link href="/metrics">Metrics</Link> {" | "}
              <Link href="/submit-urls">Submit URLs</Link> {" | "}
              <Link href="/readiness">Readiness</Link> {" | "}
              <Link href="/revenue">Revenue</Link>
            </div>
          )}
          <div className="container muted" style={{ textAlign: "center", fontSize: 12, paddingTop: 4, paddingBottom: 8 }}>
            Data version: {getCurrentSnapshot().version}
          </div>
        </footer>
      </body>
    </html>
  );
}