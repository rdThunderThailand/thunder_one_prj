import { Badge } from "@/components/ui/Badge";
import { MonitorIcon } from "@/components/ui/icons";
import { ARRANGEMENT_OPTIONS } from "../display-config";
import { canvasResolutionFor, withAutoMappedScreens, type CreateChannelDraft } from "../create-wizard-state";
import type { ChannelPlayerCandidate } from "../player-candidates";
import type { ChannelLocationOption, ChannelOutputKind } from "../types";
import { OutputMappingTable } from "./create-wizard/OutputMappingTable";
import { PlayerPickerField } from "./create-wizard/PlayerPickerField";

const fieldClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const OUTPUT_KIND_LABEL: Record<ChannelOutputKind, string> = {
  screen: "Screen (Digital Signage)",
  tv: "TV (Television)",
  kiosk: "Kiosk (Interactive)",
};

function EditorSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
          {number}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ChannelEditorForm({
  draft,
  locations,
  candidates,
  candidatesLoading,
  nameError,
  excludeChannelId,
  onChange,
  onRefreshCandidates,
}: {
  draft: CreateChannelDraft;
  locations: ChannelLocationOption[];
  candidates: ChannelPlayerCandidate[];
  candidatesLoading: boolean;
  nameError?: string;
  excludeChannelId: string;
  onChange: (next: CreateChannelDraft) => void;
  onRefreshCandidates: () => void;
}) {
  const selectedPlayer = candidates.find((candidate) => candidate.id === draft.playerId) ?? null;
  const canvas = canvasResolutionFor(draft);

  return (
    <div className="space-y-4">
      <EditorSection number={1} title="Basic Information" subtitle="Tell us about this channel.">
        <div className="grid gap-4 md:grid-cols-[128px_minmax(0,1fr)] md:items-center">
          <label htmlFor="channel-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Channel Name *</label>
          <div>
            <input
              id="channel-name"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
              className={`${fieldClasses} ${nameError ? "border-red-400 focus:border-red-500" : ""}`}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "channel-name-error" : undefined}
            />
            {nameError && <p id="channel-name-error" className="mt-1 text-xs text-red-500">{nameError}</p>}
          </div>

          <label htmlFor="channel-output-kind" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type *</label>
          <select
            id="channel-output-kind"
            value={draft.outputKind}
            onChange={(event) => onChange({ ...draft, outputKind: event.target.value as ChannelOutputKind })}
            className={fieldClasses}
          >
            {Object.entries(OUTPUT_KIND_LABEL).map(([kind, label]) => (
              <option key={kind} value={kind}>{label}</option>
            ))}
          </select>

          <label htmlFor="channel-location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
          <select
            id="channel-location"
            value={draft.locationId ?? ""}
            onChange={(event) => onChange({ ...draft, locationId: event.target.value || null })}
            className={fieldClasses}
          >
            <option value="">No location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>

          <label htmlFor="channel-description" className="self-start pt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <div>
            <textarea
              id="channel-description"
              value={draft.description}
              maxLength={300}
              rows={3}
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
              className={`${fieldClasses} resize-y`}
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{draft.description.length}/300</p>
          </div>
        </div>
      </EditorSection>

      <EditorSection number={2} title="Display Configuration" subtitle="Set the screen layout and resolution for this channel.">
        <fieldset>
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Screen Mode</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["single", "multi"] as const).map((mode) => {
              const selected = draft.displayMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange(withAutoMappedScreens({ ...draft, displayMode: mode }))}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full border-2 ${selected ? "border-indigo-600 bg-indigo-600 shadow-[inset_0_0_0_3px_white]" : "border-zinc-300"}`} />
                  <span>
                    <span className="block text-sm font-semibold">{mode === "single" ? "Single-screen" : "Multi-screen"}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{mode === "single" ? "One screen, one output" : "Multiple screens, one channel"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {draft.displayMode === "multi" ? "Screen Resolution" : "Resolution"}
            <select
              value={draft.screenResolution}
              onChange={(event) => onChange(withAutoMappedScreens({ ...draft, screenResolution: event.target.value }))}
              className={fieldClasses}
            >
              <option value="1920x1080">1920 × 1080 (Full HD)</option>
              <option value="3840x2160">3840 × 2160 (4K)</option>
            </select>
          </label>
          {draft.displayMode === "multi" ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Arrangement
              <select
                value={draft.arrangementKey}
                onChange={(event) => onChange(withAutoMappedScreens({ ...draft, arrangementKey: event.target.value }))}
                className={fieldClasses}
              >
                {ARRANGEMENT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/40">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Resolution</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{canvas.replace("x", " × ")}</p>
            </div>
          )}
        </div>
        {draft.displayMode === "multi" && (
          <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950/40">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Resolution</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{canvas.replace("x", " × ")}</p>
          </div>
        )}
      </EditorSection>

      <EditorSection number={3} title="Player & Output Mapping" subtitle="Assign the Player device and configure each screen output.">
        <PlayerPickerField
          candidates={candidates}
          selectedId={draft.playerId}
          loading={candidatesLoading}
          excludeChannelId={excludeChannelId}
          onSelect={(candidate) => onChange({ ...draft, playerId: candidate.id })}
          onRefresh={onRefreshCandidates}
        />
        {selectedPlayer && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950/40">
            <span className="text-zinc-500 dark:text-zinc-400">{selectedPlayer.model ?? selectedPlayer.code}</span>
            <Badge color={selectedPlayer.health === "online" ? "green" : "zinc"}>
              {selectedPlayer.health[0]!.toUpperCase() + selectedPlayer.health.slice(1)}
            </Badge>
          </div>
        )}
        {draft.screens.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <MonitorIcon className="h-4 w-4 text-indigo-600" />
              Screen Outputs
            </p>
            <OutputMappingTable screens={draft.screens} onChange={(screens) => onChange({ ...draft, screens })} />
          </div>
        )}
      </EditorSection>
    </div>
  );
}
