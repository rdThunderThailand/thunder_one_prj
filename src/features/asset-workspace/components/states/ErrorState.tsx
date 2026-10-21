"use client";

// Error-with-retry state (P1-06, DS-11). The copy is fixed on purpose: raw
// Core or DB errors never reach the screen. Without `onRetry` it re-runs the
// Server Component fetch, like People's LoadFailure.
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircleIcon, RefreshIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";

export function ErrorState({
  title = "Couldn't load this",
  body = "Something went wrong on our side. Try again in a moment.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();

  return (
    <EmptyState
      icon={AlertCircleIcon}
      title={title}
      detail={body}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry ?? (() => router.refresh())}
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Retry
        </Button>
      }
    />
  );
}
