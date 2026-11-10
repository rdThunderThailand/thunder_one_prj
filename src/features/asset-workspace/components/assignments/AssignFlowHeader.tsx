import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { ActionSteps } from "./ActionSteps";

const crumb = "inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring";
type Origin = { href: string; label: string };

/** Fixed above the scrolling body on FE 02–04 action pages. */
export function AssignFlowCrumb({ origin, assetId, assetName, title }: { origin: Origin; assetId: string | null; assetName?: string; title: string }) {
  const trail = assetId && origin.label === "Asset Profile"
    ? [{ href: "/asset-workspace/assets", label: "Assets" }, { href: origin.href, label: assetName || "Asset Profile" }]
    : [{ href: "/asset-workspace/assignments", label: "Assignments" }];
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-xs text-muted-foreground"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        {trail.map((item) => (
          <li
            key={item.href}
            className="flex min-w-0 items-center gap-1 wrap-anywhere"
          >
            <Link
              href={item.href}
              className={crumb}
            >
              {item.label}
            </Link>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-3 shrink-0"
            />
          </li>
        ))}
        <li
          aria-current="page"
          className="font-medium text-foreground"
        >
          {title}
        </li>
      </ol>
    </nav>
  );
}

/** Frame 16: back arrow, title and steps head the left column; the summary panel starts level with them.
 *  `mockNote` marks a flow the PO has not designed yet. */
export function AssignFlowTitle({ origin, title, subtitle, steps, step, mockNote = false }: {
  origin: Origin; title: string; subtitle: string; steps?: string[]; step?: number; mockNote?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-4 pb-1">
      <div className="flex flex-wrap items-start gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          <Link
            href={origin.href}
            aria-label={`Back to ${origin.label}`}
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4"
            />
          </Link>
        </Button>
        <PageHeader
          title={title}
          subtitle={subtitle}
        />
        {/* shortcut: PO has no Assign design yet (decisions 2026-11-10), remove once PO approves this flow */}
        {mockNote && (
          <p
            role="note"
            className="flex min-w-0 flex-wrap items-center gap-2 self-center text-xs text-muted-foreground"
          >
            <Badge
              color="yellow"
              variant="pill"
            >
              Needs attention
            </Badge>
            <span className="wrap-anywhere">PO hasn&apos;t approved or provided a design for this flow. The current UI is a mock-up.</span>
          </p>
        )}
      </div>
      {steps && (
        <ActionSteps
          steps={steps}
          current={step ?? 0}
        />
      )}
    </div>
  );
}

/** Left column = title + steps + page content; right column = summary panel (below on narrow screens). */
export function ActionLayout({ head, main, panel }: { head: ReactNode; main: ReactNode; panel?: ReactNode }) {
  if (!panel) {
    return (
      <div className="min-w-0 space-y-3">
        {head}
        {main}
      </div>
    );
  }
  return (
    <div className="grid min-w-0 items-start gap-3 @min-4xl/assign-flow:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        {head}
        {main}
      </div>
      {panel}
    </div>
  );
}
