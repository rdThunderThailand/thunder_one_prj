import type { ReactNode } from "react";
import { ClockIcon, LocationIcon } from "@/components/ui/icons";
import { assignmentDate } from "../../domain/assignment-current";

type Icon = typeof ClockIcon;

/** PO frames 16 / 20–22: every section title has a dark icon before it, subtitle aligned under the text. */
export function SectionTitle({ icon: Glyph, children, subtitle }: { icon: Icon; children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Glyph
          aria-hidden="true"
          className="size-4 shrink-0 text-foreground"
        />
        {children}
      </h2>
      {subtitle && <p className="pl-6 text-2xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/** A numbered block inside the Review card (frames 20 / 22). */
export function ReviewSection({ icon, title, children }: { icon: Icon; title: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-2 rounded-control border border-border p-3">
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </section>
  );
}

/** Label-over-value columns used in the review rows. */
export function ReviewFields({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid min-w-0 gap-3 pl-6 text-xs @min-2xl/assign-flow:grid-cols-3">
      {fields.map((field) => (
        <div
          key={field.label}
          className="min-w-0 space-y-1"
        >
          <dt className="text-2xs text-muted-foreground">{field.label}</dt>
          <dd className="text-foreground wrap-anywhere">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** From / To box on Review: holder, then location and since lines with their icons. */
export function PartyBox({ icon: Glyph, title, accent = false, holder, location, since }: {
  icon: Icon; title: string; accent?: boolean; holder: ReactNode; location: string; since?: string | null;
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-control border border-border p-3">
      <h3 className={`flex items-center gap-2 text-xs font-semibold ${accent ? "text-accent-foreground" : "text-foreground"}`}>
        <Glyph
          aria-hidden="true"
          className="size-4 shrink-0"
        />
        {title}
      </h3>
      <div className="flex-1 space-y-2 rounded-control bg-muted p-3">
        {holder}
        <p className="flex items-center gap-1 pl-1 text-2xs text-muted-foreground wrap-anywhere">
          <LocationIcon
            aria-hidden="true"
            className="size-3 shrink-0"
          />
          {location}
        </p>
        {since && (
          <p className="flex items-center gap-1 pl-1 text-2xs text-muted-foreground">
            <ClockIcon
              aria-hidden="true"
              className="size-3 shrink-0"
            />
            Since {assignmentDate(since)}
          </p>
        )}
      </div>
    </section>
  );
}
