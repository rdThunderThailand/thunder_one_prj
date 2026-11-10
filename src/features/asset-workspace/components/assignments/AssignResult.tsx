import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { locationTrail } from "../../domain/asset-profile";
import { AssignHolder } from "./AssignHolder";

/** The only success signal (no toast) for FE 02–04: what changed and where to go next. */
export function AssignResult({ before, after, title = "Asset assigned" }: { before: AssetDetail; after: AssetDetail; title?: string }) {
  const banner = useRef<HTMLDivElement>(null);
  useEffect(() => banner.current?.focus(), []);
  const links = [
    { href: `/asset-workspace/assets/${encodeURIComponent(after.id)}`, label: "Asset Profile" },
    { href: "/asset-workspace/assignments?tab=history", label: "Assignment History" },
  ];
  return (
    <Card className="space-y-4 p-4">
      <div
        ref={banner}
        role="status"
        tabIndex={-1}
        className="flex items-start gap-3 rounded-control bg-success-muted p-3 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <CheckCircleIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-success"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground wrap-anywhere">{after.name} · {after.assetTag}</p>
        </div>
      </div>
      <dl className="grid gap-3 text-xs sm:grid-cols-2">
        {[{ label: "Before", asset: before }, { label: "After", asset: after }].map((side) => (
          <div
            key={side.label}
            className="space-y-2 rounded-control bg-muted p-3"
          >
            <dt className="text-2xs font-medium text-muted-foreground">{side.label}</dt>
            <dd className="space-y-1 text-foreground">
              <p>{side.asset.lifecycleStatus}</p>
              {side.asset.custody ? (
                <AssignHolder
                  type={side.asset.custody.type}
                  name={side.asset.custody.name}
                  secondary={side.asset.custody.department?.name}
                  avatarUrl={side.asset.custody.avatarUrl}
                />
              ) : (
                <p className="text-muted-foreground">No current custodian</p>
              )}
              <p className="text-muted-foreground wrap-anywhere">
                {locationTrail(side.asset.locationPath, side.asset.location) || "No location"}
              </p>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={link.href}>
              {link.label}
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4"
              />
            </Link>
          </Button>
        ))}
        <Button
          asChild
          size="sm"
        >
          <Link href="/asset-workspace/assignments">Back to Assignments</Link>
        </Button>
      </div>
    </Card>
  );
}
