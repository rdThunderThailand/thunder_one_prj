import { resolutionLabel } from "@/features/media-workspace/playlists";
import { arrangementByKey } from "../../display-config";
import { canvasResolutionFor, type CreateChannelDraft } from "../../create-wizard-state";
import type { ChannelPlayerCandidate } from "../../player-candidates";
import type { ChannelLocationOption } from "../../types";

const OUTPUT_KIND_LABEL: Record<CreateChannelDraft["outputKind"], string> = {
  screen: "Screen",
  tv: "TV",
  kiosk: "Kiosk",
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-1.5 text-sm last:border-0 dark:border-zinc-800">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function Step3Review({
  draft,
  locations,
  player,
}: {
  draft: CreateChannelDraft;
  locations: ChannelLocationOption[];
  player: ChannelPlayerCandidate | null;
}) {
  const canvas = canvasResolutionFor(draft);
  const locationName = locations.find((l) => l.id === draft.locationId)?.name ?? "Unassigned";
  const typeLabel =
    draft.displayMode === "multi"
      ? `${OUTPUT_KIND_LABEL[draft.outputKind]} (Multi-screen)`
      : OUTPUT_KIND_LABEL[draft.outputKind];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Channel Information</h3>
        <dl className="mt-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <ReviewRow label="Channel Name" value={draft.name} />
          <ReviewRow label="Channel Type" value={typeLabel} />
          <ReviewRow label="Location" value={locationName} />
          <ReviewRow label="Description" value={draft.description.trim() || "—"} />
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Display Configuration</h3>
        <dl className="mt-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <ReviewRow label="Display Mode" value={draft.displayMode === "single" ? "Single-screen" : "Multi-screen"} />
          {draft.displayMode === "multi" && (
            <ReviewRow label="Arrangement" value={arrangementByKey(draft.arrangementKey).label} />
          )}
          <ReviewRow
            label={draft.displayMode === "multi" ? "Resolution (per screen)" : "Resolution"}
            value={resolutionLabel(draft.screenResolution)}
          />
          {draft.displayMode === "multi" && <ReviewRow label="Total Resolution" value={resolutionLabel(canvas)} />}
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Player &amp; Output Mapping</h3>
        <dl className="mt-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <ReviewRow label="Player" value={player ? `${player.name}${player.model ? ` (${player.model})` : ""}` : "—"} />
          {draft.screens.map((screen) => (
            <ReviewRow key={screen.index} label={screen.output} value={`Display ${screen.index + 1} · ${screen.resolution}`} />
          ))}
        </dl>
      </div>

      <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300">
        <p className="font-semibold">What&apos;s Next?</p>
        <ul className="mt-1 list-disc pl-4">
          <li>Channel will be created and added to All Channels.</li>
          <li>You can manage group membership later.</li>
          <li>To play content, create a program and assign this channel as the target.</li>
        </ul>
      </div>
    </div>
  );
}
