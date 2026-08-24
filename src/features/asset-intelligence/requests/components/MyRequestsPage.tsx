import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import { getMockAssetRequests } from "../mock-data";
import type { AssetRequestStatus } from "../types";

const STEPS: { key: AssetRequestStatus; label: string }[] = [
  { key: "waiting_it", label: "Waiting IT" },
  { key: "approved", label: "Approved" },
  { key: "completed", label: "Done" },
];

function StatusTimeline({ status }: { status: AssetRequestStatus }) {
  if (status === "rejected") {
    return (
      <Badge color="red" variant="pill">
        Rejected
      </Badge>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                index <= currentIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
            <span
              className={`text-xs ${
                index <= currentIndex
                  ? "font-medium text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <span
              className={`h-px w-6 ${index < currentIndex ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function MyRequestsPage() {
  const myRequests = getMockAssetRequests().filter((r) => r.requesterId === CURRENT_EMPLOYEE_ID);

  if (myRequests.length === 0) {
    return (
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        You haven&apos;t requested any assets yet.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {myRequests.map((request) => (
        <Card key={request.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-zinc-900 dark:text-zinc-50">{request.description}</p>
            <span className="shrink-0 text-xs text-zinc-400">{request.requestedAt}</span>
          </div>
          <StatusTimeline status={request.status} />
        </Card>
      ))}
    </div>
  );
}
