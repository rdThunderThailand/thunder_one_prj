import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";

export interface RegistrationReviewRow {
  label: string; value: string; required?: boolean; warning?: boolean; long?: boolean;
}

export function RegistrationReviewRows({ rows }: { rows: RegistrationReviewRow[] }) {
  const visible = rows.filter((row) => row.required || row.warning || row.value.trim());
  const omitted = rows.filter((row) => !visible.includes(row));
  return (
    <div className="space-y-1">
      {visible.length > 0 && <ReviewValues rows={visible} />}
      {omitted.length > 0 && (
        <details className="group/optional text-xs text-muted-foreground">
          <summary className="min-h-8 w-fit cursor-pointer rounded-control py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {omitted.length} optional {omitted.length === 1 ? "field" : "fields"} not provided · {" "}
            <span className="group-open/optional:hidden">Expand details</span>
            <span className="hidden group-open/optional:inline">Hide details</span>
          </summary>
          <ReviewValues rows={omitted} />
        </details>
      )}
    </div>
  );
}

function ReviewValues({ rows }: { rows: RegistrationReviewRow[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className={`grid min-w-0 grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-2 ${row.long || row.warning ? "sm:col-span-2" : ""}`}>
          <dt className="wrap-anywhere text-muted-foreground">{row.label}</dt>
          <dd className={`min-w-0 whitespace-pre-wrap wrap-anywhere ${row.warning || row.required && !row.value.trim() ? "text-error" : "text-foreground"}`}>
            {row.warning ? row.value : <ReviewText value={row.value.trim() || (row.required ? "Required information missing" : "Not provided")} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewText({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  if (value.length <= 240) return value;
  return (
    <div className="space-y-1">
      <p>{expanded ? value : `${value.slice(0, 240)}…`}</p>
      <Button variant="ghost" size="sm" className="px-2" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
        {expanded ? "Show less" : "Show more"}
      </Button>
    </div>
  );
}
