"use client";

import { useState } from "react";
import type { LogEntry, Video, VideoUploadUrlResponse } from "../types";
import { callApi, uploadToStorage } from "../services/e2e-api";

type VideosPanelProps = {
  onLog: (entry: LogEntry) => void;
  videos: Video[];
  onVideosChange: (videos: Video[]) => void;
};

export function VideosPanel({
  onLog,
  videos,
  onVideosChange,
}: VideosPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [step, setStep] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSelectSample = async () => {
    try {
      setStep("Fetching sample video...");
      const res = await fetch("/sample/sample-360p-10s.mp4");
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample-360p-10s.mp4", {
        type: "video/mp4",
      });
      setFile(sampleFile);
      setTitle("sample-360p-10s.mp4");
      setStep("");
    } catch (err) {
      alert("Failed to load sample video: " + String(err));
      setStep("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      setTitle(selected.name);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const { entry, data } = await callApi<Video[]>({
      method: "GET",
      path: "/media/videos",
    });
    onLog(entry);
    if (data && Array.isArray(data)) {
      onVideosChange(data);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    try {
      setStep("Step 1/3: Getting upload URL...");
      const { entry: urlEntry, data: urlData } =
        await callApi<VideoUploadUrlResponse>({
          method: "POST",
          path: "/media/videos/upload-url",
          body: {
            filename: file.name,
            mime_type: file.type || "video/mp4",
            file_size_bytes: file.size,
          },
        });
      onLog(urlEntry);

      if (!urlData || !urlData.upload_url || !urlData.file_id) {
        setStep("Error: Failed to get upload URL");
        setLoading(false);
        return;
      }

      setStep("Step 2/3: Uploading binary file...");
      await uploadToStorage(urlData.upload_url, file, (pct) => setProgress(pct));

      setStep("Step 3/3: Registering video metadata...");
      const { entry: regEntry } = await callApi<Video>({
        method: "POST",
        path: "/media/videos",
        body: {
          file_id: urlData.file_id,
          title: title || file.name,
          duration_seconds: 10,
        },
      });
      onLog(regEntry);

      setStep("Upload completed successfully!");
      setFile(null);
      setTitle("");
      await handleRefresh();
    } catch (err) {
      setStep("Upload failed: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setLoading(true);
    const { entry } = await callApi<unknown>({
      method: "POST",
      path: `/media/videos/${id}/approve`,
      body: { status: "approved" },
    });
    onLog(entry);
    await handleRefresh();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { entry } = await callApi<unknown>({
      method: "DELETE",
      path: `/media/videos/${id}`,
    });
    onLog(entry);
    await handleRefresh();
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          1. Videos Panel
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh List
        </button>
      </div>

      <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="text-xs text-zinc-600 dark:text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-semibold hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
          />
          <button
            type="button"
            onClick={handleSelectSample}
            className="rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ใช้ไฟล์ตัวอย่าง
          </button>
        </div>

        {file && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Upload Video
            </button>
          </div>
        )}

        {step && (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            <div>{step}</div>
            {progress > 0 && progress < 100 && (
              <div className="mt-1 h-1.5 w-full rounded bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-1.5 rounded bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
              <th className="py-2 px-1">Title</th>
              <th className="py-2 px-1">ID</th>
              <th className="py-2 px-1">Kind</th>
              <th className="py-2 px-1">Approval</th>
              <th className="py-2 px-1">Status</th>
              <th className="py-2 px-1 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-zinc-400">
                  No videos loaded. Click Refresh List.
                </td>
              </tr>
            ) : (
              videos.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-zinc-100 dark:border-zinc-800/50"
                >
                  <td className="py-2 px-1 font-medium text-zinc-800 dark:text-zinc-200">
                    {v.title ?? v.name ?? v.id}
                  </td>
                  <td className="py-2 px-1 font-mono text-[11px] text-zinc-500">
                    {v.id}
                  </td>
                  <td className="py-2 px-1 text-zinc-500">{v.kind ?? "—"}</td>
                  <td className="py-2 px-1 text-zinc-500">{v.approval_status ?? "—"}</td>
                  <td className="py-2 px-1 text-zinc-500">{v.status ?? "ready"}</td>
                  <td className="py-2 px-1 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(v.id)}
                      disabled={loading}
                      className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
