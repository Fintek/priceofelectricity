import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  REGULATORY_QUEUE,
  QUEUE_STATUS_LABELS,
  QUEUE_KIND_LABELS,
  getQueueCounts,
  type QueueItemStatus,
} from "@/content/regulatoryQueue";
import { STATES } from "@/data/states";

const BASE_URL = SITE_URL;

const TITLE = "Regulatory Update Queue";
const DESCRIPTION =
  "Internal workflow view of incoming regulatory entries pending review, publication, or rejection. Entries may be unverified placeholders until reviewed and published.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/regulatory/queue` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/regulatory/queue`,
  },
};

const VALID_STATUSES: QueueItemStatus[] = ["new", "reviewed", "published", "rejected"];

function isValidStatus(s: string): s is QueueItemStatus {
  return (VALID_STATUSES as string[]).includes(s);
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegulatoryQueuePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "new";
  const activeStatus: QueueItemStatus | "all" =
    rawStatus === "all"
      ? "all"
      : isValidStatus(rawStatus)
      ? rawStatus
      : "new";

  const filteredItems =
    activeStatus === "all"
      ? [...REGULATORY_QUEUE].sort((a, b) =>
          b.discoveredDate.localeCompare(a.discoveredDate)
        )
      : REGULATORY_QUEUE.filter((item) => item.status === activeStatus).sort(
          (a, b) => b.discoveredDate.localeCompare(a.discoveredDate)
        );

  const counts = getQueueCounts();
  const totalCount = REGULATORY_QUEUE.length;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/regulatory/queue`,
    dateModified: LAST_REVIEWED,
  };

  const filterLinks: { label: string; value: string; count: number | null }[] = [
    { label: "New", value: "new", count: counts.new },
    { label: "Reviewed", value: "reviewed", count: counts.reviewed },
    { label: "Published", value: "published", count: counts.published },
    { label: "Rejected", value: "rejected", count: counts.rejected },
    { label: "All", value: "all", count: totalCount },
  ];

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/regulatory">Regulatory</Link> {" → "} Queue
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This is a public workflow view of incoming regulatory entries awaiting
        review or publication. Entries marked{" "}
        <b>new</b> or <b>reviewed</b> may be unverified placeholders and have
        not yet been added to the published regulatory pages. This page is
        informational and is not legal advice.
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Queue summary</h2>
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            paddingLeft: 0,
            listStyle: "none",
            margin: 0,
          }}
        >
          {filterLinks.map((f) => {
            const isActive = activeStatus === f.value;
            return (
              <li key={f.value}>
                <Link
                  href={`/regulatory/queue?status=${f.value}`}
                  prefetch={false}
                  style={{
                    display: "inline-block",
                    padding: "4px 14px",
                    border: isActive ? "2px solid #333" : "1px solid #ccc",
                    borderRadius: 4,
                    fontWeight: isActive ? 700 : 400,
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  {f.label}
                  {f.count !== null && (
                    <span
                      className="muted"
                      style={{ marginLeft: 6, fontWeight: 400 }}
                    >
                      ({f.count})
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>
          {activeStatus === "all"
            ? `All items (${filteredItems.length})`
            : `${QUEUE_STATUS_LABELS[activeStatus as QueueItemStatus]} (${filteredItems.length})`}
        </h2>

        {filteredItems.length === 0 ? (
          <p className="muted">No items with this status.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "8px 12px" }}>State</th>
                  <th style={{ padding: "8px 12px" }}>Kind</th>
                  <th style={{ padding: "8px 12px" }}>Discovered</th>
                  <th style={{ padding: "8px 12px" }}>Title</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stateName =
                    STATES[item.state]?.name ?? item.state;
                  return (
                    <>
                      <tr
                        key={item.id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <Link href={`/regulatory/${item.state}`} prefetch={false}>
                            {stateName}
                          </Link>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {QUEUE_KIND_LABELS[item.kind]}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {item.discoveredDate}
                        </td>
                        <td style={{ padding: "8px 12px" }}>{item.title}</td>
                        <td style={{ padding: "8px 12px" }}>
                          {QUEUE_STATUS_LABELS[item.status]}
                        </td>
                      </tr>
                      <tr
                        key={`${item.id}-detail`}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td
                          colSpan={5}
                          style={{
                            padding: "4px 12px 12px",
                            fontSize: 13,
                          }}
                        >
                          <span className="muted">{item.summary}</span>
                          {item.sourceHint && (
                            <span className="muted">
                              {" · "}
                              <b>Source hint:</b> {item.sourceHint}
                            </span>
                          )}
                          {item.notes && (
                            <span className="muted">
                              {" · "}
                              <b>Notes:</b> {item.notes}
                            </span>
                          )}
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/regulatory">Regulatory hub</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
