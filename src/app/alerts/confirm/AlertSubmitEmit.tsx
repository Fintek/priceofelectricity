"use client";

import { useEffect, useRef } from "react";
import { emitEvent } from "@/lib/events";

type AlertSubmitEmitProps = {
  area: "regulatory" | "ai-energy" | "state";
  state?: string;
  frequency?: string;
  topics?: string[];
};

export default function AlertSubmitEmit({
  area,
  state,
  frequency,
  topics,
}: AlertSubmitEmitProps) {
  const emittedRef = useRef(false);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    emitEvent("alert_submit", { area, state, frequency, topics });
  }, [area, state, frequency, topics]);

  return null;
}
