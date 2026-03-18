import { log } from "@/lib/logger";

type RoutePhase = "render" | "api";

type RouteRuntimeProfile = {
  routeId: string;
  phase: RoutePhase;
  durationMs: number;
  artifactCount: number;
  requestId?: string;
};

type KnowledgeArtifactAccess = {
  artifactPath: string;
  routeId?: string;
  readMs: number;
  parseMs: number;
  totalMs: number;
  bytes: number;
};

type LongtailDataEvent = {
  targetId: "stateLongtail" | "averageBill" | "billEstimator";
  operation: string;
  durationMs: number;
  contextLabel?: string;
  stateSlug?: string;
  sampleMeta?: Record<string, number | string | boolean | null>;
};

function parseSampleRate(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0.1;
  if (parsed <= 0) return 0;
  if (parsed >= 1) return 1;
  return parsed;
}

function telemetryEnabled(): boolean {
  return process.env.RUNTIME_TELEMETRY === "1";
}

function shouldEmitSample(): boolean {
  if (!telemetryEnabled()) return false;
  const sampleRate = parseSampleRate(process.env.RUNTIME_TELEMETRY_SAMPLE_RATE);
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}

function roundMs(value: number): number {
  return Number(value.toFixed(3));
}

export function startRuntimeTimer(): number {
  return performance.now();
}

export function elapsedMs(startTime: number): number {
  return roundMs(performance.now() - startTime);
}

export function emitRouteRuntimeProfile(event: RouteRuntimeProfile): void {
  if (!shouldEmitSample()) return;
  log("info", "route runtime profile", {
    event: "route_runtime_profile",
    route_id: event.routeId,
    phase: event.phase,
    duration_ms: roundMs(event.durationMs),
    artifact_count: event.artifactCount,
    request_id: event.requestId ?? "",
  });
}

export function emitKnowledgeArtifactAccess(event: KnowledgeArtifactAccess): void {
  if (!shouldEmitSample()) return;
  log("info", "knowledge artifact access", {
    event: "knowledge_artifact_access",
    source: "fs",
    artifact_path: event.artifactPath,
    route_id: event.routeId ?? "unknown",
    read_ms: roundMs(event.readMs),
    parse_ms: roundMs(event.parseMs),
    total_ms: roundMs(event.totalMs),
    bytes: event.bytes,
  });
}

export function emitLongtailData(event: LongtailDataEvent): void {
  if (!shouldEmitSample()) return;
  log("info", "longtail data telemetry", {
    event_type: "longtail_data",
    target_id: event.targetId,
    operation: event.operation,
    duration_ms: roundMs(event.durationMs),
    context_label: event.contextLabel ?? "unknown",
    state_slug: event.stateSlug ?? "",
    ...(event.sampleMeta ?? {}),
  });
}
