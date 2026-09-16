import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  BroadcastIcon,
  CalendarIcon,
  GridIcon,
  LayoutIcon,
  MegaphoneIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { quickActions, type QuickActionData, type QuickActionIcon } from "../mock-data";

const iconFor: Record<QuickActionIcon, React.ReactNode> = {
  publication: <BroadcastIcon />,
  playlist: <LayoutIcon />,
  upload: <UploadIcon />,
  campaign: <MegaphoneIcon />,
  schedule: <CalendarIcon />,
  channel: <GridIcon />,
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

export function QuickActionsCard() {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-xs font-medium uppercase text-zinc-900 dark:text-zinc-50">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {quickActions.map((action) => {
          const content = (
            <>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconBackground[action.color]} ${iconColor[action.color]}`}>
                {iconFor[action.icon]}
              </span>
              <span>
                <span className="block text-xs font-semibold">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-medium text-zinc-500">{actionDescriptions[action.label]}</span>
              </span>
            </>
          );
          const className =
            "flex min-h-16 items-center gap-3 rounded-lg border border-zinc-200 p-2 text-left text-zinc-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-45";

          return action.href ? (
            <Link key={action.label} href={action.href} className={className}>
              {content}
            </Link>
          ) : (
            <button key={action.label} className={className} title="Not built yet" disabled>
              {content}
            </button>
          );
        })}
      </div>
    </Card>

  );
}
