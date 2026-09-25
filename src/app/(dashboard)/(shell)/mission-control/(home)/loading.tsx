import { MissionControlSkeleton } from "@/features/mission-control";

// In the (home) route group so this fallback wraps only the homepage — a
// loading.tsx directly in mission-control/ would also wrap the
// approvals/insights/reports sub-routes and flash the home skeleton there.
export default function Loading() {
  return <MissionControlSkeleton />;
}
