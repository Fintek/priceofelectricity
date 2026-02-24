"use client";

import type { ReactNode } from "react";
import { emitEvent, type EventName } from "@/lib/events";

type TrackLinkProps = {
  href: string;
  children: ReactNode;
  eventName: EventName;
  payload: any;
  className?: string;
  target?: string;
  rel?: string;
};

export default function TrackLink({
  href,
  children,
  eventName,
  payload,
  className,
  target,
  rel,
}: TrackLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => {
        emitEvent(eventName, payload);
      }}
    >
      {children}
    </a>
  );
}
