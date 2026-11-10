import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { WizardSteps } from "@/components/ui/WizardSteps";

const crumb = "inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring";

export function AssignFlowHeader({ origin, assetId, assetName, steps, step }: {
  origin: { href: string; label: string }; assetId: string | null; assetName?: string; steps?: string[]; step?: number;
}) {
  const trail = assetId && origin.label === "Asset Profile"
    ? [{ href: "/asset-workspace/assets", label: "Assets" }, { href: origin.href, label: assetName || "Asset Profile" }]
    : [{ href: "/asset-workspace/assignments", label: "Assignments" }];
  return (
    <div className="min-w-0 space-y-3">
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
            Assign Asset
          </li>
        </ol>
      </nav>
      <div className="flex items-start gap-3">
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
          title="Assign Asset"
          subtitle="Assign this asset to a person or team."
        />
        {/* shortcut: PO has no Assign design yet (decisions 2026-11-10), remove once PO approves this flow */}
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
      </div>
      {steps && (
        <WizardSteps
          steps={steps}
          currentIndex={step ?? 0}
        />
      )}
    </div>
  );
}
