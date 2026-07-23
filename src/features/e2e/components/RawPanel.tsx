"use client";

import { useState } from "react";
import type { LogEntry } from "../types";
import { callApi } from "../services/e2e-api";

type RawPanelProps = {
  onLog: (entry: LogEntry) => void;
  deviceToken: string;
};

export function RawPanel({ onLog, deviceToken }: RawPanelProps) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/media/videos");
  const [bodyText, setBodyText] = useState("");
  const [useDeviceToken, setUseDeviceToken] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setJsonError(null);
    let parsedBody: unknown = undefined;

    if (bodyText.trim() && method !== "GET" && method !== "HEAD") {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (err) {
        setJsonError("Invalid JSON body: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    setLoading(true);
    const { entry } = await callApi<unknown>({
      method,
      path: path.startsWith("/") ? path : `/${path}`,
      body: parsedBody,
      deviceToken: useDeviceToken ? deviceToken : undefined,
    });
    onLog(entry);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-3 text-sm">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        6. Raw HTTP Request Runner
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded border border-zinc-300 px-2.5 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/media/videos"
          className="flex-1 min-w-[200px] rounded border border-zinc-300 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Send Request
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useDeviceToken}
            onChange={(e) => setUseDeviceToken(e.target.checked)}
            className="rounded"
          />
          Send as device token
        </label>
      </div>

      {method !== "GET" && method !== "HEAD" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            JSON Body:
          </label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={3}
            placeholder='{ "name": "sample" }'
            className="rounded border border-zinc-300 p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      {jsonError && (
        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
          {jsonError}
        </div>
      )}
    </div>
  );
}
