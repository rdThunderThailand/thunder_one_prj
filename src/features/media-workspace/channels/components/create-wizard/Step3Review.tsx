import { resolutionLabel } from "@/features/media-workspace/playlists";
import { CheckCircleIcon, ClipboardIcon, EditIcon, MonitorIcon } from "@/components/ui/icons";
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
    <div className="flex items-center justify-between gap-4 border-b border-border py-1 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const Icon = icon;

  return (
    <section className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
            <Icon />
          </span>
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <EditIcon className="h-4 w-4" />
          Edit
        </button>
      </div>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

export function Step3Review({
  draft,
  locations,
  player,
  onEditChannel,
  onEditSetup,
}: {
  draft: CreateChannelDraft;
  locations: ChannelLocationOption[];
  player: ChannelPlayerCandidate | null;
  onEditChannel: () => void;
  onEditSetup: () => void;
}) {
  const canvas = canvasResolutionFor(draft);
  const locationName = locations.find((l) => l.id === draft.locationId)?.name ?? "Unassigned";
  const typeLabel =
    draft.displayMode === "multi"
      ? `${OUTPUT_KIND_LABEL[draft.outputKind]} (Multi-screen)`
      : OUTPUT_KIND_LABEL[draft.outputKind];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Review &amp; Create</h3>
        <p className="mt-1 text-sm text-muted-foreground">Confirm the details before creating the channel.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ReviewSection title="Channel Information" icon={ClipboardIcon} onEdit={onEditChannel}>
          <ReviewRow label="Channel Name" value={draft.name} />
          <ReviewRow label="Channel Type" value={typeLabel} />
          <ReviewRow label="Location" value={locationName} />
          <ReviewRow label="Description" value={draft.description.trim() || "—"} />
        </ReviewSection>

        <ReviewSection title="Display Configuration" icon={MonitorIcon} onEdit={onEditSetup}>
          <ReviewRow label="Display Mode" value={draft.displayMode === "single" ? "Single-screen" : "Multi-screen"} />
          {draft.displayMode === "multi" && (
            <ReviewRow label="Arrangement" value={arrangementByKey(draft.arrangementKey).label} />
          )}
          <ReviewRow
            label={draft.displayMode === "multi" ? "Resolution (per screen)" : "Resolution"}
            value={resolutionLabel(draft.screenResolution)}
          />
          {draft.displayMode === "multi" && <ReviewRow label="Total Resolution" value={resolutionLabel(canvas)} />}
        </ReviewSection>
      </div>

      <ReviewSection title="Player & Output Mapping" icon={MonitorIcon} onEdit={onEditSetup}>
          <ReviewRow label="Player" value={player ? `${player.name}${player.model ? ` (${player.model})` : ""}` : "—"} />
          {draft.screens.map((screen) => (
            <ReviewRow key={screen.index} label={screen.output} value={`Display ${screen.index + 1} · ${screen.resolution}`} />
          ))}
      </ReviewSection>

      <div className="rounded-lg bg-primary-soft p-3 text-xs text-primary">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircleIcon className="h-4 w-4" />
          What&apos;s Next?
        </p>
        <ul className="mt-1 list-disc pl-6">
          <li>Channel will be created and added to All Channels.</li>
          <li>You can manage group membership later.</li>
          <li>To play content, create a program and assign this channel as the target.</li>
        </ul>
      </div>
    </div>
  );
}
