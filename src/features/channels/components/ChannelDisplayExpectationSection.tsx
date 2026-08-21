import { Card } from "@/components/ui/Card";
import { RESOLUTIONS, parseResolution, resolutionLabel } from "@/features/playlists";
import type { ChannelOrientation } from "../types";

const fieldClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export interface ChannelDisplayExpectationValue {
  orientation: ChannelOrientation | null;
  resolution: string | null;
  defaultPlaylistId: string;
}

export function ChannelDisplayExpectationSection({
  value,
  playlists,
  onChange,
}: {
  value: ChannelDisplayExpectationValue;
  playlists: { id: string; name: string }[];
  onChange: (next: ChannelDisplayExpectationValue) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            3
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              Output contract
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Playback Configuration
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Describe the intended screen geometry before assigning hardware.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Orientation
          <select
            value={value.orientation ?? ""}
            onChange={(event) => {
              const orientation = (event.target.value || null) as ChannelOrientation | null;
              const resolution = parseResolution(value.resolution ?? undefined);
              const resolutionOrientation = resolution
                ? resolution.width >= resolution.height
                  ? "landscape"
                  : "portrait"
                : null;
              onChange({
                ...value,
                orientation,
                resolution:
                  orientation && resolutionOrientation && orientation !== resolutionOrientation
                    ? null
                    : value.resolution,
              });
            }}
            className={fieldClasses}
          >
            <option value="">Not set</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Resolution
          <select
            value={value.resolution ?? ""}
            onChange={(event) => {
              const resolution = event.target.value || null;
              const parsed = parseResolution(resolution ?? undefined);
              onChange({
                ...value,
                resolution,
                orientation: parsed
                  ? parsed.width >= parsed.height
                    ? "landscape"
                    : "portrait"
                  : value.orientation,
              });
            }}
            className={fieldClasses}
          >
            <option value="">Not set</option>
            {RESOLUTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {resolutionLabel(option.value)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
          Default Playlist <span className="font-normal text-zinc-400">(optional)</span>
          <select
            value={value.defaultPlaylistId}
            onChange={(event) => onChange({ ...value, defaultPlaylistId: event.target.value })}
            className={fieldClasses}
          >
            <option value="">No default playlist</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Prefill for new Publications; not fallback playback.
          </span>
        </label>
      </div>
    </Card>
  );
}
