import type { PickerEntry } from "../template-picker";
import { LayoutWireframe } from "./LayoutWireframe";

/**
 * Template Picker's right rail. QA 2026-10-08 #16: a portrait wireframe at full rail width is ~500px
 * tall and pushed the details out of the clipped dialog, so the preview gets a fixed box and the rail
 * scrolls on its own.
 */
export function TemplateDetailsPanel({ selected }: { selected: PickerEntry | null }) {
  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-t border-border bg-muted p-4 lg:border-l lg:border-t-0">
      <p className="mb-3 text-sm font-semibold text-foreground">Template Details</p>
      {selected ? (
        <div className="space-y-3">
          <div className="flex h-56 items-center justify-center">
            <LayoutWireframe
              zones={selected.zones}
              background="var(--program)"
              aspectRatio={selected.aspectRatio}
              programStyle
              className="h-full max-w-full rounded-lg border border-border"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{selected.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{selected.zoneCount} Zones · {selected.orientation}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Resolution</dt>
            <dd>{selected.referenceResolution ?? "Not set"}</dd>
            <dt className="text-muted-foreground">Aspect ratio</dt>
            <dd>{selected.aspectRatio}</dd>
            <dt className="text-muted-foreground">On use</dt>
            <dd>{selected.behaviour === "copied" ? "Copied" : "Shared"}</dd>
          </dl>
          {selected.useCases.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full bg-primary-soft px-2 py-1 text-[11px] text-primary"
                >
                  {useCase}
                </span>
              ))}
            </div>
          )}
          {selected.description && <p className="text-xs leading-5 text-muted-foreground">{selected.description}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a template to see its details.</p>
      )}
    </aside>
  );
}
