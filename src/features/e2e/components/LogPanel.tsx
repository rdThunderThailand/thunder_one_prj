"use client";

import type { LogEntry } from "../types";

type LogPanelProps = {
  logs: LogEntry[];
  onClear: () => void;
};

export function LogPanel({ logs, onClear }: LogPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Request Log ({logs.length})
        </h2>
        <button
          onClick={onClear}
          disabled={logs.length === 0}
          className="rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Clear
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No HTTP requests logged yet. Actions will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          {logs.map((entry) => {
            const is2xx =
              entry.status !== null && entry.status >= 200 && entry.status < 300;
            const is4xx =
              entry.status !== null && entry.status >= 400 && entry.status < 500;
            
            let badgeClass =
              "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
            if (is2xx) {
              badgeClass =
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
            } else if (is4xx) {
              badgeClass =
                "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
            }

            return (
              <div
                key={entry.id}
                className="rounded border border-zinc-200 p-3 text-xs dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold ${badgeClass}`}
                    >
                      {entry.status ?? "ERR"}
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {entry.method}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                      {entry.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                    <span>{entry.ms}ms</span>
                    <span>{new Date(entry.at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <details className="mt-2 text-[11px]">
                  <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                    View payload & response
                  </summary>
                  <div className="mt-2 space-y-2 font-mono">
                    <div>
                      <div className="font-semibold text-zinc-500">Request:</div>
                      <pre className="mt-0.5 overflow-x-auto rounded bg-zinc-100 p-2 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                        {JSON.stringify(entry.request, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-500">Response:</div>
                      <pre className="mt-0.5 overflow-x-auto rounded bg-zinc-100 p-2 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                        {JSON.stringify(entry.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
