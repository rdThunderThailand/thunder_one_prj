import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { auditItems } from "../mock-data";

export function AuditAssessmentCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Audit &amp; Assessment</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex-1 space-y-4">
        {auditItems.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</span>
                <span className="ml-1.5 text-xs text-zinc-400">{item.period}</span>
              </div>
              <span
                className={`text-xs font-medium ${item.kind === "score" ? "text-emerald-500" : "text-blue-500"}`}
              >
                {item.kind === "score" ? "Score" : item.statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar value={item.percent} color={item.kind === "score" ? "emerald" : "indigo"} className="flex-1" />
              <span className="w-10 shrink-0 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.percent}%
              </span>
            </div>
            {item.kind !== "score" && <p className="mt-1 text-xs text-zinc-400">{item.statusLabel}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
