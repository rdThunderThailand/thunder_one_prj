import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { lifecycleStatus } from "../mock-data";

export function LifecycleStatusCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถานะ Lifecycle</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col justify-center gap-3">
        {lifecycleStatus.map((row) => (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {row.value.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-zinc-400">({row.percent}%)</span>
              </span>
            </div>
            <ProgressBar value={row.percent} color={row.color === "zinc" ? "indigo" : row.color} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
