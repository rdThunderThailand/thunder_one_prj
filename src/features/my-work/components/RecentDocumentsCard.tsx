import { Card } from "@/components/ui/Card";
import { ChartIcon, ClipboardIcon, ImageIcon } from "@/components/ui/icons";
import { recentDocuments, type RecentDocumentData } from "../mock-data";

const iconFor: Record<RecentDocumentData["icon"], React.ReactNode> = {
  slides: <ImageIcon />,
  sheet: <ChartIcon />,
  pdf: <ClipboardIcon />,
};

const tone: Record<RecentDocumentData["icon"], string> = {
  slides: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  sheet: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  pdf: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export function RecentDocumentsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Documents</h2>
        <span className="cursor-not-allowed text-xs text-zinc-300 dark:text-zinc-700" title="Not built yet">
          View all
        </span>
      </div>
      <ul className="space-y-3">
        {recentDocuments.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[doc.icon]}`}>
              {iconFor[doc.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">{doc.title}</p>
              <p className="truncate text-xs text-zinc-400">{doc.openedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
