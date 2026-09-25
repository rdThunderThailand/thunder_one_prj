import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Shown while the profile's Core reads run — mirrors the page's header card
// and first tab so nothing jumps when it lands.
export default function Loading() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="กำลังโหลดโปรไฟล์"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-7 w-44" />
      <Card className="flex items-center gap-4 p-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
      </Card>
      <div className="flex gap-6">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className="h-5 w-28"
          />
        ))}
      </div>
      <Card className="flex flex-col gap-4 p-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex justify-between"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </Card>
    </div>
  );
}
