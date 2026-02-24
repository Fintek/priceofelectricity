"use client";

import type { ReactNode } from "react";

type OutboundLinkProps = {
  id: string;
  label: string;
  page: string;
  href: string;
  stateSlug?: string;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
};

type PlausibleFn = (
  eventName: string,
  options?: { props?: Record<string, string> },
) => void;

export default function OutboundLink({
  id,
  label,
  page,
  href,
  stateSlug,
  target = "_blank",
  rel = "noopener noreferrer",
  className,
  children,
}: OutboundLinkProps) {
  const handleClick = () => {
    const plausible = (window as Window & { plausible?: PlausibleFn }).plausible;
    plausible?.("OutboundClick", {
      props: {
        id,
        label,
        page,
        ...(stateSlug ? { stateSlug } : {}),
      },
    });
  };

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
