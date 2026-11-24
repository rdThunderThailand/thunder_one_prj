// Cross-screen states for Asset Workspace (P1-06, ADR 0098 §5 / DS-11). Every
// data surface shows one of these instead of styling its own. Light only.
//
// Organization boundary: a record that belongs to another Organization renders
// NotFoundState, never AccessDeniedState — "access denied" would confirm the
// record exists. AccessDeniedState is only for a page the role cannot use.
import type { ReactNode } from "react";
import { EmptyState as EmptyStateBase } from "@/components/ui/EmptyState";
import { BoxIcon, LockIcon, SearchIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";

interface StateProps {
  title?: string;
  body?: string;
  action?: ReactNode;
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="space-y-2 py-2"
    >
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          className="h-10 w-full"
        />
      ))}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", body = "Items appear here once they are added.", action }: StateProps) {
  return (
    <EmptyStateBase
      icon={BoxIcon}
      title={title}
      detail={body}
      action={action}
    />
  );
}

export function AccessDeniedState({
  title = "You don't have access",
  body = "Your role can't open this page. Ask an Asset Admin if you need it.",
  action,
}: StateProps) {
  return (
    <EmptyStateBase
      icon={LockIcon}
      title={title}
      detail={body}
      action={action}
    />
  );
}

export function NotFoundState({
  title = "Not found",
  body = "This item doesn't exist or is no longer available.",
  action,
}: StateProps) {
  return (
    <EmptyStateBase
      icon={SearchIcon}
      title={title}
      detail={body}
      action={action}
    />
  );
}
