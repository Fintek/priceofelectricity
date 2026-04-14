"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/electricity-cost-comparison", label: "State comparisons" },
  { href: "/energy-comparison", label: "Energy comparison" },
  { href: "/electricity-cost-calculator", label: "Calculator" },
  { href: "/datasets", label: "Data" },
  { href: "/methodology", label: "Methodology" },
  { href: "/electricity-trends", label: "Trends" },
  { href: "/electricity-insights", label: "Insights" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/about", label: "About & Trust" },
  { href: "/search", label: "Search" },
  { href: "/site-map", label: "Site Map" },
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) close();
    },
    [close],
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="mobile-nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          className="mobile-nav-backdrop"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer${open ? " mobile-nav-drawer--open" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
      >
        <ul className="mobile-nav-list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`mobile-nav-link${pathname === href ? " mobile-nav-link--active" : ""}`}
                onClick={close}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
