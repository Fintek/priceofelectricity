import Link from "next/link";
import { Fragment } from "react";
import { SITE_URL } from "@/lib/site";

export type BreadcrumbItem = {
  /** Visible label for this crumb. */
  name: string;
  /**
   * Path or absolute URL for the crumb. Omit (or pass undefined) for the
   * current page so it renders as plain text and is marked aria-current.
   */
  url?: string;
};

export type BreadcrumbsProps = {
  trail: BreadcrumbItem[];
  /**
   * When true, emits the BreadcrumbList JSON-LD inline. Set false if the
   * containing page already emits it through JsonLdScript.
   */
  emitJsonLd?: boolean;
  className?: string;
};

/**
 * Build the BreadcrumbList JSON-LD object from a breadcrumb trail. Reusable
 * by pages that batch JSON-LD into a single <JsonLdScript /> call.
 */
export function breadcrumbsToJsonLd(trail: BreadcrumbItem[]): Record<string, unknown> {
  const base = SITE_URL.replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => {
      const url = item.url ?? "";
      const absolute = url.startsWith("http")
        ? url
        : url
          ? `${base}${url.startsWith("/") ? "" : "/"}${url}`
          : undefined;
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
      };
      if (absolute) entry.item = absolute;
      return entry;
    }),
  };
}

export default function Breadcrumbs({
  trail,
  emitJsonLd = false,
  className,
}: BreadcrumbsProps) {
  if (trail.length <= 1) return null;

  return (
    <>
      {emitJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbsToJsonLd(trail)),
          }}
        />
      )}
      <nav
        aria-label="Breadcrumb"
        className={
          className ? `breadcrumb-nav ${className}` : "breadcrumb-nav"
        }
      >
        <ol className="breadcrumb-list">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <Fragment key={`${index}-${item.name}`}>
                <li className="breadcrumb-item">
                  {!isLast && item.url ? (
                    <Link href={item.url}>{item.name}</Link>
                  ) : (
                    <span aria-current="page">{item.name}</span>
                  )}
                </li>
                {!isLast && (
                  <li aria-hidden="true" className="breadcrumb-separator">
                    ›
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
