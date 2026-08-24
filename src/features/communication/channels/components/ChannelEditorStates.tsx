import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ClassifiedError } from "@/lib/api/api-error";

export function EditorSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {[280, 360, 240].map((height) => (
          <Card key={height} className="p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-5 w-60" />
            <Skeleton className="mt-5 w-full" />
            <div style={{ height }} />
          </Card>
        ))}
      </div>
      <Card className="h-96 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-12 w-full" />
      </Card>
    </div>
  );
}

export function EditorLoadError({
  error,
  retrying,
  onRetry,
}: {
  error: ClassifiedError;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="border-red-200 p-8 text-center dark:border-red-900/70">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Channel editor is unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-red-600 dark:text-red-400">
        {error.message}
      </p>
      <Button variant="secondary" className="mt-4" disabled={retrying} onClick={onRetry}>
        {retrying ? "Retrying…" : "Retry"}
      </Button>
    </Card>
  );
}

export function UnsupportedCategoryState({ category }: { category: "online" | "social" }) {
  return (
    <Card className="border-amber-300 p-8 text-center dark:border-amber-800">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        This Channel category is not supported by the Physical Device editor
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        {category === "online" ? "Online" : "Social"} Channels require a different endpoint editor.
        This page will not submit a category that its controls cannot display.
      </p>
      <Link href="/communication/channels" className={buttonClasses("secondary", "mt-4")}>
        Back to Channels
      </Link>
    </Card>
  );
}

export function ChannelSaveErrorCard({
  error,
  saving,
  onReload,
  onOverwrite,
}: {
  error: ClassifiedError;
  saving: boolean;
  onReload: () => void;
  onOverwrite: () => void;
}) {
  return (
    <Card
      id="channel-save-error"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`p-4 ${
        error.kind === "conflict" ? "border-amber-300 dark:border-amber-800" : "border-red-200 dark:border-red-900/70"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {error.kind === "conflict" ? "Already modified" : "Channel was not saved"}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{error.message}</p>
      {error.kind === "conflict" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onReload}>
            Reload latest
          </Button>
          <Button type="button" disabled={saving} onClick={onOverwrite}>
            Overwrite latest
          </Button>
        </div>
      )}
    </Card>
  );
}

export function ChannelCompatibilityErrorCard({ message }: { message: string }) {
  return (
    <Card
      id="channel-compatibility-error"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="border-amber-300 bg-amber-50/50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-500/5 dark:text-amber-300"
    >
      {message}
    </Card>
  );
}
