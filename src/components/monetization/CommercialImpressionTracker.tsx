"use client";

import { useEffect, useRef } from "react";

type PlausibleFn = (
  eventName: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

type CommercialImpressionTrackerProps = {
  eventName: string;
  props: Record<string, string | number | boolean>;
};

export default function CommercialImpressionTracker({
  eventName,
  props,
}: CommercialImpressionTrackerProps) {
  const emittedRef = useRef(false);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    const plausible = (window as Window & { plausible?: PlausibleFn }).plausible;
    plausible?.(eventName, { props });
  }, [eventName, props]);

  return null;
}
