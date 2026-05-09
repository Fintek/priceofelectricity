import Link from "next/link";
import {
  getCanonicalDatasetSynchronizedMediumDateUtc,
  getCanonicalEiaReleasePublishedMediumDateUtc,
  getCanonicalResidentialDataThroughMonthLabel,
} from "@/lib/eiaReportingTrust";

/**
 * Compact EIA data trust messaging for high-traffic landing pages (homepage, compare).
 */
export default function EiaHomeTrustLine() {
  const eiaMonth = getCanonicalResidentialDataThroughMonthLabel();
  const released = getCanonicalEiaReleasePublishedMediumDateUtc();
  const syncUtc = getCanonicalDatasetSynchronizedMediumDateUtc();

  return (
    <>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, maxWidth: "72ch", lineHeight: 1.55 }}>
        Latest EIA data: {eiaMonth}
        {released !== null ? <>, released {released}</> : null}
        {syncUtc !== null ? <> · Dataset synchronized {syncUtc} (UTC)</> : null}
        {" · "}
        <Link href="/methodology">Methodology</Link> · <Link href="/datasets">Data</Link>
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20, fontSize: 12, maxWidth: "72ch", lineHeight: 1.5 }}>
        EIA publishes monthly state electricity data with a reporting lag.
      </p>
    </>
  );
}
