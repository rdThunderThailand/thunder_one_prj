import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CalendarIcon, ChartIcon, ClipboardIcon, ImageIcon, ListIcon } from "@/components/ui/icons";
import { quickAccessDocs, type QuickAccessDocData } from "../mock-data";

const iconFor: Record<QuickAccessDocData["icon"], React.ReactNode> = {
  guideline: <ImageIcon />,
  template: <ClipboardIcon />,
  plan: <ListIcon />,
  calendar: <CalendarIcon />,
  dashboard: <ChartIcon />,
};

export function QuickAccessDocsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Frequently Used Documents &amp; Links</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickAccessDocs.map((doc) => (
          <div
            key={doc.id}
            title="Not built yet"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-zinc-100 p-4 text-center dark:border-zinc-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              {iconFor[doc.icon]}
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{doc.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
