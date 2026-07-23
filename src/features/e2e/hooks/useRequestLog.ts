"use client";

import { useCallback, useState } from "react";
import type { LogEntry } from "../types";

export function useRequestLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const push = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, push, clear };
}
