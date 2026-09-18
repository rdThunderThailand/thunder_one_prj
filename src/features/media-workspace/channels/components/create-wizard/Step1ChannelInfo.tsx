import { BoxIcon, MonitorIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import type { CreateChannelDraft } from "../../create-wizard-state";
import type { ChannelLocationOption, ChannelOutputKind } from "../../types";

const fieldClasses =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

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
        <h3 className="text-sm font-semibold text-foreground">1. Select Channel Type</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Choose the type of channel you want to create.</p>
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
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-border"
                }`}
              >
                <Icon className={`h-6 w-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-[11px] text-muted-foreground">{hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">2. Basic Information</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Set the basic details for this channel.</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Input
            name="create-channel-name"
            label="Channel Name *"
            value={draft.name}
            error={nameError}
            placeholder="e.g. Cafe Menu Board"
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
            <span>
              Location <span className="font-normal text-muted-foreground">(optional)</span>
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
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground md:col-span-2">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea
              value={draft.description}
              maxLength={300}
              rows={3}
              placeholder="Describe where this channel is used."
              onChange={(event) => onChange({ ...draft, description: event.target.value })}
              className={`${fieldClasses} resize-y`}
            />
            <span className="self-end text-[11px] text-muted-foreground">{draft.description.length}/300</span>
          </label>
        </div>
      </div>
    </div>
  );
}
