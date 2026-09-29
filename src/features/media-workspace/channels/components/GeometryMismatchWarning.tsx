import { Checkbox } from "@/components/ui/lovable/checkbox";

export function GeometryMismatchWarning({
  id,
  warning,
  confirmed,
  onConfirmChange,
}: {
  id: string;
  warning: string;
  confirmed: boolean;
  onConfirmChange: (confirmed: boolean) => void;
}) {
  return (
    <div role="alert" className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-foreground">
      <p className="font-semibold text-warning">Player display does not match this Channel</p>
      <p className="mt-1">{warning}</p>
      <div className="mt-3 flex items-start gap-2">
        <Checkbox
          id={id}
          checked={confirmed}
          onCheckedChange={(value) => onConfirmChange(value === true)}
          className="mt-0.5"
        />
        <label htmlFor={id} className="cursor-pointer">
          I understand the mismatch and want to continue.
        </label>
      </div>
    </div>
  );
}
