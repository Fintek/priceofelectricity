type JsonLdScriptProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Renders a JSON-LD script tag. Pass single object or array of objects.
 */
export default function JsonLdScript({ data }: JsonLdScriptProps) {
  const json = Array.isArray(data) ? data : data;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
