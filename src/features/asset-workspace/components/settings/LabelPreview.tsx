import type { LabelFieldSettings, LabelIdentifier } from "../../domain/asset-settings";

// Sample asset, like Figma's Tag Preview. Only the saved tag format is real: the next tag comes from Settings.
const SAMPLE = { name: 'MacBook Pro 14"', serial: "C02Z45FXQ8L", category: "Electronics", location: "HQ - Office 1" };

/** Tag Preview (Figma Labels / Asset Tags): what the label will show with the current choices. 50 × 30 mm, so 5 : 3. */
export function LabelPreview({
  identifier,
  fields,
  tag,
}: {
  identifier: LabelIdentifier;
  fields: LabelFieldSettings;
  tag: string;
}) {
  const showQr = identifier !== "barcode";
  const showBars = identifier !== "qr";
  return (
    <figure className="min-w-0 space-y-1">
      <figcaption className="text-xs font-medium text-foreground">Tag Preview</figcaption>
      <div
        role="img"
        aria-label={`Label preview for ${tag}`}
        className="flex aspect-[5/3] w-full max-w-72 flex-col justify-between gap-1 rounded-lg border border-border bg-card p-3"
      >
        {fields.logo && <span className="w-fit rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Logo</span>}
        <div className="flex min-h-0 flex-1 items-center gap-3">
          {showQr && (
            <span
              aria-hidden="true"
              className="grid size-14 shrink-0 grid-cols-5 grid-rows-5 gap-px rounded-xs border border-border bg-card p-1"
            >
              {Array.from({ length: 25 }, (_, i) => (
                <span
                  key={i}
                  className={[0, 1, 2, 4, 5, 7, 10, 12, 14, 17, 20, 22, 23, 24].includes(i) ? "bg-foreground" : "bg-transparent"}
                />
              ))}
            </span>
          )}
          <div className="min-w-0 space-y-0.5 text-[11px] leading-tight text-foreground">
            {fields.name && <p className="truncate text-xs font-semibold">{SAMPLE.name}</p>}
            <p className="truncate font-medium">{tag}</p>
            {fields.serial && <p className="truncate text-muted-foreground">SN: {SAMPLE.serial}</p>}
            {fields.category && <p className="truncate text-muted-foreground">Category: {SAMPLE.category}</p>}
            {fields.location && <p className="truncate text-muted-foreground">Location: {SAMPLE.location}</p>}
          </div>
        </div>
        {showBars && (
          <span
            aria-hidden="true"
            className="h-4 w-full rounded-xs bg-[repeating-linear-gradient(90deg,var(--color-foreground)_0_1px,transparent_1px_3px,var(--color-foreground)_3px_5px,transparent_5px_6px)]"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">Sample data. Actual labels use each asset&apos;s own details.</p>
    </figure>
  );
}
