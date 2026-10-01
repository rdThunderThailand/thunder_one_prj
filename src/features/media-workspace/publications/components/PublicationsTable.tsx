"use client";

import Link from "next/link";
import { Badge, type BadgeProps } from "@/components/ui/lovable/badge";
import { Progress } from "@/components/ui/lovable/progress";
import { MediaThumb } from "@/components/ui/MediaThumb";
import {
  DISPLAY_STATUS_LABELS,
  deliveryView,
  formatNextAiring,
  formatScheduleRange,
  formatTargetSummary,
} from "../publication-list-display";
import type { PublicationDisplayStatus, PublicationListItem } from "../types";
import { PublicationRowActions } from "./PublicationRowActions";

const BADGE_VARIANT: Record<PublicationDisplayStatus, BadgeProps["variant"]> = {
  draft: "outline",
  publishing: "info",
  scheduled: "warning",
  live: "success",
  ended: "neutral",
};

const HEADERS = ["Program", "Status", "Target", "Schedule", "Deployment / Progress", "Last Updated", "Created by"];

function formatUpdatedAt(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function PublicationsTable({
  rows,
  busyId,
  onAction,
}: {
  rows: PublicationListItem[];
  busyId: string | null;
  onAction: (action: "duplicate" | "delete" | "end", item: PublicationListItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium text-muted-foreground">
            {HEADERS.map((header) => (
              <th
                key={header}
                className="px-3 py-2.5"
              >
                {header}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const nextAiring = formatNextAiring(item);
            const delivery = deliveryView(item);
            return (
              <tr
                key={item.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="max-w-72 px-3 py-3">
                  <div className="flex items-center gap-3">
                    {item.thumbnail_url ? (
                      <MediaThumb
                        url={item.thumbnail_url}
                        alt=""
                        className="h-12 w-16"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-12 w-16 shrink-0 rounded bg-muted"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/media-workspace/program/${item.id}`}
                        className="block truncate font-medium text-foreground hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      {item.content_name && (
                        <p className="truncate text-xs text-muted-foreground">{item.content_name}</p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="neutral"
                              className="px-1.5 py-0 text-[10px] font-medium"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {item.display_status && (
                    <Badge variant={BADGE_VARIANT[item.display_status]}>
                      {DISPLAY_STATUS_LABELS[item.display_status]}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-3 text-foreground">{formatTargetSummary(item)}</td>
                <td className="px-3 py-3">
                  <p className="text-foreground">{formatScheduleRange(item)}</p>
                  {nextAiring && <p className="text-xs text-muted-foreground">{nextAiring}</p>}
                </td>
                <td className="min-w-40 px-3 py-3">
                  <p className="text-foreground">{delivery.label}</p>
                  {delivery.ratio && <p className="text-xs text-muted-foreground">{delivery.ratio}</p>}
                  {delivery.percent !== null && (
                    <Progress
                      value={delivery.percent}
                      className="mt-1 h-1"
                    />
                  )}
                  {delivery.problems && <p className="mt-1 text-xs text-warning">{delivery.problems}</p>}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {formatUpdatedAt(item.updated_at ?? item.created_at)}
                </td>
                <td className="max-w-32 truncate px-3 py-3 text-muted-foreground">{item.created_by?.display_name ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <PublicationRowActions
                    item={item}
                    busy={busyId === item.id}
                    onAction={onAction}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
