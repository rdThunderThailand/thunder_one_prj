import { RESOLUTIONS, resolutionLabel } from "@/features/media-workspace/playlists";
import { Badge } from "@/components/ui/Badge";
import { MonitorIcon } from "@/components/ui/icons";
import { ARRANGEMENT_OPTIONS } from "../../display-config";
import { canvasResolutionFor, withAutoMappedScreens, type CreateChannelDraft } from "../../create-wizard-state";
import type { ChannelPlayerCandidate } from "../../player-candidates";
import { OutputMappingTable } from "./OutputMappingTable";
import { PlayerPickerField } from "./PlayerPickerField";

const fieldClasses =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function Step2Setup({
  draft,
  candidates,
  candidatesLoading,
  excludeChannelId,
  onChange,
  onRefreshCandidates,
}: {
  draft: CreateChannelDraft;
  candidates: ChannelPlayerCandidate[];
  candidatesLoading: boolean;
  /** Edit mode only — see `PlayerPickerField`. */
  excludeChannelId?: string;
  onChange: (next: CreateChannelDraft) => void;
  onRefreshCandidates: () => void;
}) {
  const canvas = canvasResolutionFor(draft);
  const selectedPlayer = candidates.find((c) => c.id === draft.playerId) ?? null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">1. Display Configuration</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Define the screen layout and resolution for this channel.</p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["single", "multi"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={draft.displayMode === mode}
              onClick={() => onChange(withAutoMappedScreens({ ...draft, displayMode: mode }))}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                draft.displayMode === mode
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:border-border"
              }`}
            >
              <MonitorIcon className={`h-5 w-5 ${draft.displayMode === mode ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-sm font-semibold text-foreground">
                {mode === "single" ? "Single-screen" : "Multi-screen"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {mode === "single" ? "One screen with one output" : "Multiple screens combined"}
              </span>
            </button>
          ))}
        </div>

        {draft.displayMode === "multi" && (
          <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            Arrangement
            <select
              value={draft.arrangementKey}
              onChange={(event) => onChange(withAutoMappedScreens({ ...draft, arrangementKey: event.target.value }))}
              className={fieldClasses}
            >
              {ARRANGEMENT_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            Screen Resolution {draft.displayMode === "multi" && "(per screen)"}
            <select
              value={draft.screenResolution}
              onChange={(event) => onChange(withAutoMappedScreens({ ...draft, screenResolution: event.target.value }))}
              className={fieldClasses}
            >
              {RESOLUTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {resolutionLabel(option.value)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg bg-muted px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total Resolution</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{resolutionLabel(canvas)}</p>
          </div>
        </div>

        {draft.displayMode === "multi" && (
          <div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">Preview Layout</p>
            <div className="mt-2 flex overflow-hidden rounded-lg border border-border">
              {draft.screens.map((screen) => (
                <div
                  key={screen.index}
                  className="flex-1 border-r border-border bg-muted px-2 py-4 text-center last:border-r-0"
                >
                  <p className="text-xs font-semibold text-muted-foreground">Display {screen.index + 1}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{screen.resolution}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">2. Player &amp; Output Mapping</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Select a registered player and map each display to a physical output.</p>

        <div className="mt-3">
          <PlayerPickerField
            candidates={candidates}
            selectedId={draft.playerId}
            loading={candidatesLoading}
            excludeChannelId={excludeChannelId}
            onSelect={(candidate) => onChange({ ...draft, playerId: candidate.id })}
            onRefresh={onRefreshCandidates}
          />
        </div>

        {selectedPlayer && (
          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Player Details</p>
            <dl className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Device ID</dt>
              <dd className="text-right font-mono text-foreground">{selectedPlayer.code}</dd>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="text-right text-foreground">{selectedPlayer.location?.name ?? "Unassigned"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right">
                <Badge color={selectedPlayer.health === "online" ? "green" : "zinc"}>
                  {selectedPlayer.health[0]!.toUpperCase() + selectedPlayer.health.slice(1)}
                </Badge>
              </dd>
            </dl>
          </div>
        )}

        {draft.displayMode === "multi" && draft.screens.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Map Displays to Outputs</p>
            <OutputMappingTable screens={draft.screens} onChange={(screens) => onChange({ ...draft, screens })} />
          </div>
        )}
      </div>
    </div>
  );
}
