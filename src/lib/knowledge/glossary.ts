import { readFile } from "node:fs/promises";
import path from "node:path";

export type GlossaryField = {
  id: string;
  label: string;
  unit: string;
  description: string;
  sourcePathExamples: string[];
  methodologies: Array<{ id: string; version: string }>;
  provenanceIds: string[];
};

export type GlossaryFields = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  fields: GlossaryField[];
};

const KNOWLEDGE_ROOT = path.join(process.cwd(), "public", "knowledge");
const GLOSSARY_PATH = path.join(KNOWLEDGE_ROOT, "glossary", "fields.json");

/** Load glossary fields JSON. Returns null if file missing. */
export async function loadGlossary(): Promise<GlossaryFields | null> {
  try {
    const raw = await readFile(GLOSSARY_PATH, "utf8");
    return JSON.parse(raw) as GlossaryFields;
  } catch {
    return null;
  }
}

/** Build a map of field id -> GlossaryField for quick lookup. */
export function getGlossaryMap(glossary: GlossaryFields | null): Record<string, GlossaryField> {
  if (!glossary || !Array.isArray(glossary.fields)) return {};
  const map: Record<string, GlossaryField> = {};
  for (const f of glossary.fields) {
    if (f && typeof f.id === "string") map[f.id] = f;
  }
  return map;
}
