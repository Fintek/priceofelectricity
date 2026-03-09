import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import CopyButton from "@/components/common/CopyButton";
import Section from "@/components/common/Section";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { loadSchemaMap, loadStarterPack } from "@/lib/knowledge/loadKnowledgePage";
import { getContract, getKnowledgeIndex, getPublicEndpoints, getCapabilities, getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Knowledge API Documentation | PriceOfElectricity.com",
  description:
    "Developer documentation for the Knowledge API: entry points, entity types, provenance, methodologies, snapshots, and bundles.",
  canonicalPath: "/knowledge/docs",
});

function toPath(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith("/") ? url : `/${url}`;
}

export default async function KnowledgeDocsPage() {
  const [contract, index, schemaMap, starterPack, publicEndpoints, capabilities, release] = await Promise.all([
    getContract(),
    getKnowledgeIndex(),
    loadSchemaMap(),
    loadStarterPack(),
    getPublicEndpoints(),
    getCapabilities(),
    getRelease(),
  ]);

  const qs = contract?.querySurfaces ?? {};

  const snapshotSupport = contract?.snapshotSupport;
  const hasHistory = snapshotSupport?.enabled && (snapshotSupport.historyIndexUrl || snapshotSupport.historyBundlesIndexUrl);

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Data Hub</Link>
        {" · "}
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/pages">States directory</Link>
      </nav>

      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Knowledge API Documentation</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
        Developer documentation for the Knowledge system. All artifacts are build-generated and deterministic.
      </p>

      <Section title="1. Overview">
        <p style={{ margin: 0 }}>
          The Knowledge system provides machine-readable JSON pages for U.S. electricity rates, state metrics, rankings, and methodologies.
          Use the search-index for discovery; use entity pages for details. All pages include meta.freshness, meta.provenance, and meta.qualityScore.
        </p>
      </Section>

      {starterPack?.recommendedOrder && starterPack.recommendedOrder.length > 0 && (
        <Section title="2. LLM Ingestion Starter Pack">
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Recommended ingestion sequence for LLM tools. Follow this order for optimal discovery.
          </p>
          <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            {starterPack.recommendedOrder.map((item) => (
              <li key={item.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <Link href={toPath(item.url)}>{item.url}</Link>
                <span className="muted">— {item.why}</span>
                <CopyButton value={`${BASE_URL}${toPath(item.url)}`} label={`Copy ${item.url}`} />
              </li>
            ))}
          </ol>
          {starterPack.notes && starterPack.notes.length > 0 && (
            <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
              {starterPack.notes.join(" ")}
            </p>
          )}
        </Section>
      )}

      <Section title="3. Entry points">
        <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
          Canonical list: <Link href="/knowledge/public-endpoints.json">public-endpoints.json</Link>
        </p>
        {publicEndpoints?.groups?.map((group) => (
          <div key={group.id} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{group.title}</h3>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {group.items.map((item) => (
                <li key={item.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <Link href={toPath(item.url)}>{item.url}</Link>
                  <span className="muted">— {item.description}</span>
                  <CopyButton value={`${BASE_URL}${toPath(item.url)}`} label={`Copy ${item.url}`} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>

      <Section title="4. Entity types and URL patterns">
        {schemaMap?.entities && schemaMap.entities.length > 0 ? (
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            {schemaMap.entities.map((e) => (
              <li key={e.type}>
                <strong>{e.type}</strong>: {e.jsonPattern ?? `/knowledge/${e.type}/{id}.json`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Entity patterns: national, state, methodology, rankings, vertical. See schema-map.json for details.</p>
        )}
      </Section>

      <Section title="5. Provenance + citations">
        <p style={{ margin: 0 }}>
          Every knowledge page includes <code>meta.provenance</code> (sources) and <code>meta.citations</code>.
          Field-level provenance is in <code>meta.fieldProvenance</code>. The global catalog is at{" "}
          {contract?.provenanceCatalogUrl ? (
            <Link href={toPath(contract.provenanceCatalogUrl)}>{toPath(contract.provenanceCatalogUrl)}</Link>
          ) : (
            "/knowledge/provenance.json"
          )}.
        </p>
      </Section>

      <Section title="6. Methodologies and versions">
        <p style={{ margin: 0 }}>
          Methodology definitions and versions are in the methodology index at{" "}
          {qs.methodologyIndexUrl ? (
            <Link href={toPath(qs.methodologyIndexUrl)}>{toPath(qs.methodologyIndexUrl)}</Link>
          ) : (
            "/knowledge/methodology/index.json"
          )}.
          Each methodology has id, version, and relatedDerivedFields.
        </p>
      </Section>

      {hasHistory && (
        <Section title="7. Snapshots/history">
          <p style={{ margin: 0 }}>
            Snapshot support is enabled. History index:{" "}
            {snapshotSupport?.historyIndexUrl ? (
              <Link href={toPath(snapshotSupport.historyIndexUrl)}>{toPath(snapshotSupport.historyIndexUrl)}</Link>
            ) : null}
            {snapshotSupport?.historyBundlesIndexUrl && (
              <> · Bundles: <Link href={toPath(snapshotSupport.historyBundlesIndexUrl)}>{toPath(snapshotSupport.historyBundlesIndexUrl)}</Link></>
            )}
          </p>
        </Section>
      )}

      <Section title="8. Bundles (offline ingestion)">
        <p style={{ margin: 0 }}>
          Bundles index: {qs.bundlesIndexUrl ? (
            <Link href={toPath(qs.bundlesIndexUrl)}>{toPath(qs.bundlesIndexUrl)}</Link>
          ) : (
            "/knowledge/bundles/index.json"
          )}.
          Each bundle has a manifestUrl pointing to a list of JSON files for offline ingestion.
        </p>
      </Section>

      {release && (
        <Section title="9. Release Snapshot">
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Pinned endpoints and integrity hash. See{" "}
            <Link href="/knowledge/release.json">release.json</Link> for full details.
          </p>
          <ul style={{ paddingLeft: 20, listStyle: "disc", lineHeight: 1.8 }}>
            <li><strong>releaseId</strong>: {release.releaseId}</li>
            <li><strong>sourceVersion</strong>: {release.sourceVersion}</li>
            <li><strong>contractVersion</strong>: {release.contractVersion}</li>
            {release.integrity?.manifestHash && (
              <li><strong>manifestHash</strong>: <code style={{ fontSize: 12 }}>{release.integrity.manifestHash}</code></li>
            )}
          </ul>
        </Section>
      )}

      {capabilities && (
        <Section title="10. System Capabilities">
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Build-time introspection. See{" "}
            <Link href="/knowledge/capabilities.json">capabilities.json</Link> for full details.
          </p>
          <ul style={{ paddingLeft: 20, listStyle: "disc", lineHeight: 1.8 }}>
            {["historySnapshots", "bundles", "integrityManifest", "offersEnabled"].map((key) => (
              <li key={key} style={{ marginBottom: 4 }}>
                <strong>{key}</strong>: {String(capabilities.capabilities?.[key] ?? false)}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="11. Stability/verification notes">
        <p style={{ margin: 0 }}>
          All knowledge artifacts are build-generated and deterministic. Index includes{" "}
          {index?.integritySignature ? "integritySignature" : ""}
          {index?.integritySignature && index?.registryHash ? " and " : ""}
          {index?.registryHash ? "registryHash" : ""}
          {index?.integritySignature || index?.registryHash ? " for verification. " : ""}
          Page integrity uses contentHash (SHA-256). Regression guard:{" "}
          {contract?.stability?.regressionGuardUrl ? (
            <Link href={toPath(contract.stability.regressionGuardUrl)}>{toPath(contract.stability.regressionGuardUrl)}</Link>
          ) : (
            "/knowledge/regression.json"
          )}.
        </p>
      </Section>

      <Section title="12. Release mode">
        <p style={{ margin: 0 }}>
          Run <code>RELEASE_MODE=1 npm run knowledge:check</code> to enforce strict pre-launch checks.
          Release mode validates required artifacts (release.json, capabilities.json, public-endpoints.json, integrity manifest, search-index, index, contract), llms.txt coverage, and registry wiring.
        </p>
      </Section>

      <Disclaimers disclaimerRefs={["general-site"]} />

      <StatusFooter release={release} capabilities={capabilities} />

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/data">Data Hub</Link> · <Link href="/knowledge/pages">Knowledge Directory</Link> · <Link href="/knowledge/contract.json">Contract (JSON)</Link> · <Link href="/knowledge/index.json">Index (JSON)</Link>
      </p>
    </main>
  );
}
