import { Skeleton } from "@/components/ui/lovable/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading pilot ring" className="grid gap-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
