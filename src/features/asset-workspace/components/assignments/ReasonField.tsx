import { Textarea } from "@/components/ui/lovable/textarea";
import { ASSIGN_REASON_MAX } from "../../domain/assignment-assign";

/** PO "Reason / Note": one optional field, saved to Core `reason` (max 500). */
export function ReasonField({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (value: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-xs font-medium text-foreground"
      >
        Reason / Note (optional)
      </label>
      <Textarea
        id={id}
        rows={3}
        maxLength={ASSIGN_REASON_MAX}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-count`}
      />
      <p
        id={`${id}-count`}
        className="text-right text-2xs text-muted-foreground"
      >
        {value.length}/{ASSIGN_REASON_MAX}
      </p>
    </div>
  );
}
