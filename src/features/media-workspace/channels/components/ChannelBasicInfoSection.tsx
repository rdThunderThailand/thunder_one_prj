import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type {
  ChannelCategory,
  ChannelLifecycle,
  ChannelLocationOption,
  ChannelTypeOption,
} from "../types";

const fieldClasses =
  "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const lifecycleBadges: Record<ChannelLifecycle, { label: string; color: BadgeColor }> = {
  draft: { label: "Draft", color: "zinc" },
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "zinc" },
};

export interface ChannelBasicInfoValue {
  name: string;
  category: ChannelCategory;
  channelTypeId: string;
  locationId: string;
  description: string;
  syncEnabled: boolean;
}

export function ChannelBasicInfoSection({
  value,
  lifecycle,
  channelTypes,
  currentChannelTypeId,
  locations,
  errors,
  directTargetConflicts,
  onChange,
}: {
  value: ChannelBasicInfoValue;
  lifecycle: ChannelLifecycle;
  channelTypes: ChannelTypeOption[];
  currentChannelTypeId: string | null;
  locations: ChannelLocationOption[];
  errors: Partial<Record<"name" | "channel_type_id", string>>;
  /** Active/scheduled Publications that target one of this Channel's Devices directly. Informational
   * only — turning synchronization on does not get blocked by these (ADR 0042 decision Q6). */
  directTargetConflicts: string[];
  onChange: (next: ChannelBasicInfoValue) => void;
}) {
  const availableTypes = channelTypes.filter(
    (option) => option.channel_category === value.category,
  );
  const status = lifecycleBadges[lifecycle];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
              1
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                Channel identity
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Basic Info
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Name the delivery surface and classify where it appears.
              </p>
            </div>
          </div>
          <Badge color={status.color} variant="pill">
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            name="channel-name"
            label={
              <>
                Channel name <span className="text-red-500">*</span>
              </>
            }
            value={value.name}
            error={errors.name}
            placeholder="e.g. Central World menu boards"
            onChange={(event) => onChange({ ...value, name: event.target.value })}
          />
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Category <span className="text-red-500">*</span>
          <select
            value={value.category}
            onChange={(event) => {
              const category = event.target.value as ChannelCategory;
              const keepsType = channelTypes.some(
                (option) => option.id === value.channelTypeId && option.channel_category === category,
              );
              onChange({
                ...value,
                category,
                channelTypeId: keepsType ? value.channelTypeId : "",
              });
            }}
            className={fieldClasses}
          >
            <option value="dooh">DOOH</option>
            <option value="in_store">In-store</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Type <span className="text-red-500">*</span>
          <select
            value={value.channelTypeId}
            aria-invalid={Boolean(errors.channel_type_id)}
            aria-describedby={errors.channel_type_id ? "channel-type-error" : undefined}
            onChange={(event) => onChange({ ...value, channelTypeId: event.target.value })}
            className={`${fieldClasses} ${errors.channel_type_id ? "border-red-400" : ""}`}
          >
            <option value="">Select Channel Type</option>
            {availableTypes.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={option.is_active === false && option.id !== currentChannelTypeId}
              >
                {option.name}
                {option.is_active === false
                  ? option.id === currentChannelTypeId
                    ? " (Current — unavailable)"
                    : " (Unavailable)"
                  : ""}
              </option>
            ))}
          </select>
          {errors.channel_type_id && (
            <span id="channel-type-error" className="text-xs text-red-500">
              {errors.channel_type_id}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 md:col-span-2">
          Location <span className="font-normal text-zinc-400">(optional)</span>
          <select
            value={value.locationId}
            onChange={(event) => onChange({ ...value, locationId: event.target.value })}
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
            value={value.description}
            rows={3}
            placeholder="Describe where this Channel is used."
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            className={`${fieldClasses} resize-y`}
          />
        </label>

        <div className="md:col-span-2">
          <label className="flex items-start gap-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={value.syncEnabled}
              onChange={(event) => onChange({ ...value, syncEnabled: event.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700"
            />
            <span>
              Synchronized playback
              <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Devices in this Channel align to the same position in the playback loop when they
                hold the same content.
              </span>
            </span>
          </label>
          {value.syncEnabled && directTargetConflicts.length > 0 && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {directTargetConflicts.length} publication{directTargetConflicts.length === 1 ? "" : "s"}{" "}
              target a Device in this Channel directly, bypassing it: {directTargetConflicts.join(", ")}.
              Those Devices may fall out of sync. This does not block saving.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
