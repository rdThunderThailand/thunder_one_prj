import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockRecommendations } from "../mock-data";

// CEO-03: recommendations with evidence, reviewed on the full Approvals page
// (CEO-04) rather than a per-item detail route -- same "list page with
// inline Approve/Reject" pattern used everywhere else this sprint (Thunder
// Care's Work Queue, Department Manager's Requests).
export function RequiresAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Requires Your Attention
      </h2>
      <ul className="flex flex-1 flex-col gap-4">
        {mockRecommendations.map((rec) => (
          <li key={rec.id} className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{rec.title}</p>
              {rec.status !== "pending" && (
                <Badge color={rec.status === "approved" ? "green" : "red"} variant="pill">
                  {rec.status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{rec.summary}</p>
            <p className="mt-1 text-xs text-zinc-400">Evidence: {rec.evidence}</p>
            <Link
              href="/asset-intelligence/mission-control/approvals"
              className="mt-2 inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Review recommendation
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
