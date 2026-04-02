"use client";

import type { ReactNode } from "react";

type TrackedOutboundLinkProps = {
  href: string;
  children: ReactNode;
  eventName: string;
  props?: Record<string, string | number | boolean>;
  className?: string;
  target?: string;
  rel?: string;
};

export default function TrackedOutboundLink({
  href,
  children,
  eventName,
  props,
  className,
  target = "_blank",
  rel = "noopener noreferrer",
}: TrackedOutboundLinkProps) {
  const handleClick = () => {
    (window as any).plausible?.(eventName, { props });
  };

  return (
    <a href={href} target={target} rel={rel} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
