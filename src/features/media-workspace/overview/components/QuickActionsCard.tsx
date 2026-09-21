import Link from "next/link";
import { CalendarClock, FilePlus2, Grid2x2Plus, ListVideo, Megaphone, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { quickActions, type QuickActionIcon } from "../mock-data";

const iconFor: Record<QuickActionIcon, React.ReactNode> = {
  publication: <FilePlus2 className="h-4 w-4" />,
  playlist: <ListVideo className="h-4 w-4" />,
  upload: <Upload className="h-4 w-4" />,
  campaign: <Megaphone className="h-4 w-4" />,
  schedule: <CalendarClock className="h-4 w-4" />,
  channel: <Grid2x2Plus className="h-4 w-4" />,
};

const actionDescriptions: Record<string, string> = {
  "Create Publication": "สร้างสื่อ",
  "Create Playlist": "สร้าง Playlist",
  "Create Program": "สร้าง Program",
  "Upload Media": "อัปโหลดสื่อ",
  "Add Channel": "เพิ่ม Channel",
  "Schedule Program": "ตั้งตารางเวลาเผยแพร่",
};

export function QuickActionsCard() {
  return (
    <Card className="flex h-full flex-col border-border p-4 shadow-panel transition-[box-shadow,border-color] duration-200 hover:border-foreground/20 hover:shadow-float">
      <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-foreground">
        Quick Actions
      </h2>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 sm:grid-rows-3">
        {quickActions.map((action) => {
          const content = (
            <>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted ${action.href ? "text-primary" : "text-muted-foreground"}`}>
                {iconFor[action.icon]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold">{action.label}</span>
                <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{actionDescriptions[action.label]}</span>
              </span>
            </>
          );

          return action.href ? (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-0 items-center gap-3 rounded-lg border border-border p-3 text-left text-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft"
            >
              {content}
            </Link>
          ) : (
            <button
              key={action.label}
              type="button"
              disabled
              className="flex min-h-0 cursor-not-allowed items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left text-muted-foreground"
            >
              {content}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
