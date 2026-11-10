import Link from "next/link";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { AssignHolder } from "./AssignHolder";

/** The only success signal (no toast): what changed and where to go next. */
export function AssignResult({ before, after }: { before: AssetDetail; after: AssetDetail }) {
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
          <p className="text-sm font-semibold text-foreground">Asset assigned</p>
          <p className="text-xs text-muted-foreground wrap-anywhere">{after.name} · {after.assetTag}</p>
        </div>
      </div>
      <dl className="grid gap-3 text-xs sm:grid-cols-2">
        <div className="space-y-2 rounded-control bg-muted p-3">
          <dt className="text-2xs font-medium text-muted-foreground">Before</dt>
          <dd className="space-y-1 text-foreground">
            <p>{before.lifecycleStatus}</p>
            <p className="text-muted-foreground">No current custodian</p>
          </dd>
        </div>
        <div className="space-y-2 rounded-control bg-muted p-3">
          <dt className="text-2xs font-medium text-muted-foreground">After</dt>
          <dd className="space-y-1 text-foreground">
            <p>{after.lifecycleStatus}</p>
            {after.custody && (
              <AssignHolder
                type={after.custody.type}
                name={after.custody.name}
                secondary={after.custody.department?.name}
                avatarUrl={after.custody.avatarUrl}
              />
            )}
          </dd>
        </div>
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
