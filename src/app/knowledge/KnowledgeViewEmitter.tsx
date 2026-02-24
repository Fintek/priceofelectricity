"use client";

import { useEffect, useRef } from "react";
import { emitEvent } from "@/lib/events";

export default function KnowledgeViewEmitter() {
  const emittedRef = useRef(false);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    emitEvent("knowledge_view", { format: "page" });
  }, []);

  return null;
}
