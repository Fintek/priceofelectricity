import { STATES } from "@/data/states";
import { CONTENT_TEMPLATES, type ContentBlock } from "@/content/templates";

export type GeneratedPage = {
  slug: string;
  templateId: string;
  type: string;
  stateSlug: string;
  title: string;
  description: string;
  contentBlocks: ContentBlock[];
};

function buildSlug(pattern: string, stateSlug: string): string {
  return pattern.replace("{state}", stateSlug);
}

let _cache: GeneratedPage[] | null = null;

export function generateTemplatePages(): GeneratedPage[] {
  if (_cache) return _cache;

  const pages: GeneratedPage[] = [];
  const stateSlugs = Object.keys(STATES).sort();

  for (const template of CONTENT_TEMPLATES) {
    for (const stateSlug of stateSlugs) {
      const slug = buildSlug(template.slugPattern, stateSlug);
      const generated = template.generate(stateSlug);
      pages.push({
        slug,
        templateId: template.id,
        type: template.type,
        stateSlug,
        title: generated.title,
        description: generated.description,
        contentBlocks: generated.contentBlocks,
      });
    }
  }

  _cache = pages;
  return pages;
}

export function getGeneratedPage(slug: string): GeneratedPage | undefined {
  return generateTemplatePages().find((p) => p.slug === slug);
}
