"use client";

import { useEffect, useState } from "react";
import type { LogEntry, PlayerJob, Video } from "../types";
import { callApi } from "../services/e2e-api";

type PlayerPanelProps = {
  onLog: (entry: LogEntry) => void;
  deviceToken: string;
  onDeviceTokenChange: (token: string) => void;
  videos: Video[];
};

export function PlayerPanel({
  onLog,
  deviceToken,
  onDeviceTokenChange,
  videos,
}: PlayerPanelProps) {
  const [jobs, setJobs] = useState<PlayerJob[]>([]);
  const [selectedAckStatus, setSelectedAckStatus] = useState<
    "downloading" | "playing" | "failed"
  >("playing");
  const [ackErrorText, setAckErrorText] = useState("");
  const [playbackVideoId, setPlaybackVideoId] = useState("");
  const [playbackDuration, setPlaybackDuration] = useState(10);
  const [loading, setLoading] = useState(false);

  // SSR-safe localStorage sync
  useEffect(() => {
    const saved = localStorage.getItem("thunder-e2e-device-token");
    if (saved && !deviceToken) {
      onDeviceTokenChange(saved);
    }
  }, [deviceToken, onDeviceTokenChange]);

  const handleTokenChange = (val: string) => {
    onDeviceTokenChange(val);
    localStorage.setItem("thunder-e2e-device-token", val);
  };

  const handlePollJobs = async () => {
    if (!deviceToken) return alert("Please enter a Device Token");
    setLoading(true);
    const { entry, data } = await callApi<{ jobs?: PlayerJob[] } | PlayerJob[]>({
      method: "POST",
      path: "/media/player/jobs",
      body: {},
      deviceToken,
    });
    onLog(entry);

    if (data) {
      if (Array.isArray(data)) {
        setJobs(data);
      } else if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else if (typeof data === "object") {
        setJobs([data as PlayerJob]);
      }
    }
    setLoading(false);
  };

  const handleAckJob = async (targetId: string) => {
    if (!deviceToken) return alert("Please enter a Device Token");
    setLoading(true);
    const body: { status: string; error?: string } = {
      status: selectedAckStatus,
    };
    if (selectedAckStatus === "failed" && ackErrorText.trim()) {
      body.error = ackErrorText.trim();
    }

    const { entry } = await callApi<unknown>({
      method: "POST",
      path: `/media/player/jobs/${targetId}/ack`,
      body,
      deviceToken,
    });
    onLog(entry);
    setLoading(false);
  };

  const handleHeartbeat = async () => {
    if (!deviceToken) return alert("Please enter a Device Token");
    setLoading(true);
    const { entry } = await callApi<unknown>({
      method: "POST",
      path: "/media/player/heartbeat",
      body: { app_version: "e2e-console/1.0" },
      deviceToken,
    });
    onLog(entry);
    setLoading(false);
  };

  const handlePlaybackLog = async () => {
    if (!deviceToken) return alert("Please enter a Device Token");
    if (!playbackVideoId) return alert("Please select a video");
    setLoading(true);

    const { entry } = await callApi<unknown>({
      method: "POST",
      path: "/media/player/playback",
      body: {
        logs: [
          {
            media_asset_id: playbackVideoId,
            played_at: new Date().toISOString(),
            duration_played_seconds: playbackDuration,
          },
        ],
      },
      deviceToken,
    });
    onLog(entry);
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          5. Player Simulator Panel (Device Token)
        </h2>
      </div>

      <div className="flex flex-col gap-1.5 text-xs">
        <label className="font-medium text-zinc-600 dark:text-zinc-400">
          Device Token:
        </label>
        <input
          type="text"
          value={deviceToken}
          onChange={(e) => handleTokenChange(e.target.value)}
          placeholder="Paste screen device token here..."
          className="rounded border border-zinc-300 px-2.5 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePollJobs}
          disabled={loading || !deviceToken}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Poll Jobs
        </button>
        <button
          onClick={handleHeartbeat}
          disabled={loading || !deviceToken}
          className="rounded bg-teal-600 px-3 py-1 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Send Heartbeat
        </button>
      </div>

      {/* Jobs section */}
      {jobs.length > 0 && (
        <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Player Jobs ({jobs.length})
          </div>
          {jobs.map((job, idx) => {
            const targetId = job.target_id ?? job.id ?? String(idx);
            const fileUrl = job.file?.url;

            return (
              <div
                key={targetId}
                className="rounded border border-zinc-200 p-2.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Target ID: {targetId}</span>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Open File Link ↗
                    </a>
                  )}
                </div>

                {fileUrl && (
                  <video
                    controls
                    src={fileUrl}
                    className="w-full max-h-40 rounded bg-black"
                  />
                )}

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <select
                    value={selectedAckStatus}
                    onChange={(e) =>
                      setSelectedAckStatus(
                        e.target.value as "downloading" | "playing" | "failed"
                      )
                    }
                    className="rounded border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="downloading">downloading</option>
                    <option value="playing">playing</option>
                    <option value="failed">failed</option>
                  </select>

                  {selectedAckStatus === "failed" && (
                    <input
                      type="text"
                      value={ackErrorText}
                      onChange={(e) => setAckErrorText(e.target.value)}
                      placeholder="Failure reason..."
                      className="rounded border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  )}

                  <button
                    onClick={() => handleAckJob(targetId)}
                    disabled={loading}
                    className="rounded bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                  >
                    Ack Status
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Playback Log Builder */}
      <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-2 text-xs">
        <div className="font-semibold text-zinc-700 dark:text-zinc-300">
          Simulate Playback Log
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={playbackVideoId}
            onChange={(e) => setPlaybackVideoId(e.target.value)}
            className="flex-1 min-w-[140px] rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select video...</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title ?? v.name ?? v.id}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={playbackDuration}
            onChange={(e) => setPlaybackDuration(Number(e.target.value))}
            placeholder="Duration played (s)"
            className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handlePlaybackLog}
            disabled={loading || !deviceToken || !playbackVideoId}
            className="rounded bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send Log
          </button>
        </div>
      </div>
    </div>
  );
}
