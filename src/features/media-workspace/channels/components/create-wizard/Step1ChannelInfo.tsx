import { BoxIcon, MonitorIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import type { CreateChannelDraft } from "../../create-wizard-state";
import type { ChannelLocationOption, ChannelOutputKind } from "../../types";

const fieldClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

// PA / Audio is deliberately not offered (ticket 08 deviation — ADR 0074 §2, Output Kind covers
// Screen/TV/Kiosk only).
const OUTPUT_KINDS: { kind: ChannelOutputKind; label: string; hint: string; icon: typeof MonitorIcon }[] = [
  { kind: "screen", label: "Screen", hint: "Digital signage screen(s)", icon: MonitorIcon },
  { kind: "tv", label: "TV", hint: "Television display", icon: MonitorIcon },
  { kind: "kiosk", label: "Kiosk", hint: "Interactive kiosk", icon: BoxIcon },
];

export function Step1ChannelInfo({
  draft,
  locations,
  nameError,
  onChange,
}: {
  draft: CreateChannelDraft;
  locations: ChannelLocationOption[];
  nameError?: string;
  onChange: (next: CreateChannelDraft) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">1. Select Channel Type</h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Choose the type of channel you want to create.</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {OUTPUT_KINDS.map(({ kind, label, hint, icon: Icon }) => {
            const selected = draft.outputKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ ...draft, outputKind: kind })}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-colors ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <Icon className={`h-6 w-6 ${selected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">2. Basic Information</h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Set the basic details for this channel.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Input
            name="create-channel-name"
            label="Channel Name *"
            value={draft.name}
            error={nameError}
            placeholder="e.g. Cafe Menu Board"
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span>
              Location <span className="font-normal text-zinc-400">(optional)</span>
            </span>
            <select
              value={draft.locationId ?? ""}
              onChange={(event) => onChange({ ...draft, locationId: event.target.value || null })}
              className={fieldClasses}
            >
              <option value="">No location</option>
              {locations.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
            Description <span className="font-normal text-zinc-400">(optional)</span>
            <textarea
              value={draft.description}
              maxLength={300}
              rows={3}
              placeholder="Describe where this channel is used."
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
              className={`${fieldClasses} resize-y`}
            />
            <span className="self-end text-[11px] text-zinc-400">{draft.description.length}/300</span>
          </label>
        </div>
      </div>
    </div>
  );
}
