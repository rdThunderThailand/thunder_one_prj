"use client";

import { useEffect, useState } from "react";
import type { ConfigInfo, Playlist, Screen, Video } from "../types";
import { callApi } from "../services/e2e-api";
import { useRequestLog } from "../hooks/useRequestLog";
import { VideosPanel } from "./VideosPanel";
import { ScreensPanel } from "./ScreensPanel";
import { PlaylistsPanel } from "./PlaylistsPanel";
import { PublishPanel } from "./PublishPanel";
import { PlayerPanel } from "./PlayerPanel";
import { RawPanel } from "./RawPanel";
import { LogPanel } from "./LogPanel";

export function E2EConsole() {
  const { logs, push, clear } = useRequestLog();
  const [config, setConfig] = useState<ConfigInfo | null>(null);

  // Shared state
  const [videos, setVideos] = useState<Video[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [lastPlaylistId, setLastPlaylistId] = useState<string | null>(null);
  const [lastPublicationId, setLastPublicationId] = useState<string | null>(
    null
  );
  const [deviceToken, setDeviceToken] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await callApi<ConfigInfo>({
        method: "GET",
        path: "/__config",
      });
      if (data) {
        setConfig(data);
      }
    }
    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-black/10 pb-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Thunder One Media API — E2E Test Console
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                QA & Developer POC Console for testing end-to-end video flow.
              </p>
            </div>
            {config && (
              <div className="text-xs font-mono bg-zinc-200/60 dark:bg-zinc-800/60 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700">
                Proxy Target:{" "}
                <span className="font-semibold">
                  {config.coreApiUrl || "(Not set)"}
                </span>
              </div>
            )}
          </div>

          {config && !config.hasKey && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              ⚠️ <strong>Warning:</strong> CORE_API_KEY environment variable is not configured. Server requests requiring an API key may fail.
            </div>
          )}
        </header>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Action Panels */}
          <main className="lg:col-span-7 flex flex-col gap-6">
            <VideosPanel
              onLog={push}
              videos={videos}
              onVideosChange={setVideos}
            />

            <ScreensPanel
              onLog={push}
              screens={screens}
              onScreensChange={setScreens}
              selectedScreenIds={selectedScreenIds}
              onSelectedScreenIdsChange={setSelectedScreenIds}
            />

            <PlaylistsPanel
              onLog={push}
              playlists={playlists}
              onPlaylistsChange={setPlaylists}
              lastPlaylistId={lastPlaylistId}
              onLastPlaylistIdChange={setLastPlaylistId}
              videos={videos}
            />

            <PublishPanel
              onLog={push}
              lastPlaylistId={lastPlaylistId}
              selectedScreenIds={selectedScreenIds}
              lastPublicationId={lastPublicationId}
              onLastPublicationIdChange={setLastPublicationId}
            />

            <PlayerPanel
              onLog={push}
              deviceToken={deviceToken}
              onDeviceTokenChange={setDeviceToken}
              videos={videos}
            />

            <RawPanel onLog={push} deviceToken={deviceToken} />
          </main>

          {/* Right Column: Sticky Log Panel */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <LogPanel logs={logs} onClear={clear} />
          </aside>
        </div>
      </div>
    </div>
  );
}
