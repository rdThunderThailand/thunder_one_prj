import Link from "next/link";
import { CalendarClock, FilePlus2, Grid2x2Plus, ListVideo, Megaphone, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { quickActions, type QuickActionData, type QuickActionIcon } from "../mock-data";

const iconFor: Record<QuickActionIcon, React.ReactNode> = {
  publication: <FilePlus2 className="h-4 w-4" />,
  playlist: <ListVideo className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  campaign: <Megaphone className="h-4 w-4" />,
  schedule: <CalendarClock className="h-4 w-4" />,
  channel: <Grid2x2Plus className="h-4 w-4" />,
};

const iconColor: Record<QuickActionData["color"], string> = {
  indigo: "text-indigo-500",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
  teal: "text-teal-500",
};

const actionDescriptions: Record<string, string> = {
  "Create Publication": "สร้างสื่อ",
  "Create Playlist": "สร้าง Playlist",
  "Create Program": "สร้าง Program",
  "Upload Media": "อัปโหลดสื่อ",
  "Add Channel": "เพิ่ม Channel",
  "Schedule Program": "ตั้งตารางเวลาเผยแพร่",
};

const iconBackground: Record<QuickActionData["color"], string> = {
  indigo: "bg-indigo-50",
  blue: "bg-blue-50",
  emerald: "bg-emerald-50",
  amber: "bg-amber-50",
  violet: "bg-violet-50",
  teal: "bg-teal-50",
};

// Only actions with a real destination are shown — the mockup's disabled
// "Not built yet" buttons would just be more mock UI (docs/adr/0075 §7).
const availableActions = quickActions.filter((action): action is QuickActionData & { href: string } => Boolean(action.href));

export function QuickActionsCard() {
  return (
    <Card className="border-border p-5 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
      <h2 className="mb-4 text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {availableActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex min-h-16 items-center gap-3 rounded-lg border border-zinc-200 p-2 text-left text-zinc-700 transition-colors hover:border-primary/30 hover:bg-primary-soft dark:border-zinc-800 dark:text-zinc-300"
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconBackground[action.color]} ${iconColor[action.color]}`}>
              {iconFor[action.icon]}
            </span>
            <span>
              <span className="block text-xs font-semibold">{action.label}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-zinc-500">{actionDescriptions[action.label]}</span>
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
