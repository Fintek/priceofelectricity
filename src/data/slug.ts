export function normalizeSlug(input: string): string {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toKey(slug: string): string {
  return normalizeSlug(slug).replace(/-/g, "");
}
