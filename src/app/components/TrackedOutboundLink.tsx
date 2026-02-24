"use client";

import type { ReactNode } from "react";

type TrackedOutboundLinkProps = {
  href: string;
  children: ReactNode;
  eventName: string;
  props?: Record<string, string | number | boolean>;
};

export default function TrackedOutboundLink({
  href,
  children,
  eventName,
  props,
}: TrackedOutboundLinkProps) {
  const handleClick = () => {
    (window as any).plausible?.(eventName, { props });
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
      {children}
    </a>
  );
}
