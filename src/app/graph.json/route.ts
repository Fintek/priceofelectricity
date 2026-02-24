import { NextResponse } from "next/server";
import { buildContentRegistry } from "@/lib/contentRegistry";

export const dynamic = "force-static";
export const revalidate = 86400;

type GraphNode = { id: string; type: string; url: string };
type GraphEdge = { from: string; to: string; rel: string };

export function GET() {
  const registry = buildContentRegistry();

  const graphNodes: GraphNode[] = registry.map((n) => ({
    id: n.id,
    type: n.type,
    url: n.url,
  }));

  const nodeIds = new Set(registry.map((n) => n.id));
  const edges: GraphEdge[] = [];

  for (const node of registry) {
    if (node.parent && nodeIds.has(node.parent)) {
      edges.push({ from: node.id, to: node.parent, rel: "parent" });
    }
    if (node.related) {
      for (const r of node.related) {
        if (nodeIds.has(r)) {
          edges.push({ from: node.id, to: r, rel: "related" });
        }
      }
    }
  }

  const body = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    totalNodes: graphNodes.length,
    totalEdges: edges.length,
    nodes: graphNodes,
    edges,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
