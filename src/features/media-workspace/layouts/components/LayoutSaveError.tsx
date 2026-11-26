"use client";

import type { RefusalReason } from "@/lib/api/core-refusal-rules";
import { IN_USE_LEAD, removedZoneIds, templateZoneLinks } from "../../in-use/in-use-links";
import { InUseRefusal } from "../../in-use/InUseRefusal";
import { fetchLayout } from "../services/layouts-api";
import type { LayoutZone } from "../types";

/** The Template editor's failed-save banner. A Zone-in-use refusal links to each blocking Layout (ADR 0130). */
export function LayoutSaveError({
  message,
  reason,
  templateId,
  zones,
}: {
  message: string;
  reason: RefusalReason | null;
  templateId: string | null;
  /** The draft's Zones, as the failed save sent them. */
  zones: LayoutZone[];
}) {
  return (
    <div className="shrink-0 border-b border-error/30 bg-error-muted px-4 py-2">
      {reason === "in-use" && templateId ? (
        <InUseRefusal
          message={message}
          lead={IN_USE_LEAD.templateZone}
          load={() =>
            // The removed Zones are the stored ones the save no longer carried: Core's own condition.
            fetchLayout(templateId).then((d) => {
              const stored = d.zones.flatMap((z) => (z.id ? [z.id] : []));
              return templateZoneLinks(d.compositions, removedZoneIds(stored, zones));
            })
          }
          className="text-sm text-error"
        />
      ) : (
        <p className="text-sm text-error">{message}</p>
      )}
    </div>
  );
}
