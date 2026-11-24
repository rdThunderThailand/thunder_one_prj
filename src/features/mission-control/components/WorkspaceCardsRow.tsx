import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { APPS } from "@/config/apps";
import { canOpenApp } from "@/config/tenant-access";

// Descriptive copy for the 3 workspaces the homepage highlights — People/
// Asset/Media, matching the mockup. ThunderCare and the "coming soon" tiles
// the old compact WorkspacesRow showed are left to the full /work-space
// launcher ("ดูทั้งหมด →" below), not repeated here.
const DESCRIPTIONS: Record<string, string> = {
  people: "จัดการบุคลากร โครงสร้างองค์กร และการเข้าถึงระบบ",
  "asset-intelligence": "บริหารสินทรัพย์ คำขอ และการดูแล พร้อมบริการ Thunder Care",
  "media-workspace": "จัดการเนื้อหา เพลย์ลิสต์ และจอแสดงผลทั้งหมด",
};

// Shortened English titles + a short Thai sub-line, matching the mockup's
// card header exactly — deliberately distinct from `APPS[].label` (used
// elsewhere as the sidebar tagline, e.g. "Asset Intelligence"), so this is
// its own local map rather than a change to the shared registry.
const TITLES: Record<string, string> = {
  people: "People",
  "asset-intelligence": "Asset",
  "media-workspace": "Media",
};

const SUBLABELS: Record<string, string> = {
  people: "บุคลากรและองค์กร",
  "asset-intelligence": "ทรัพย์สินและ Thunder Care",
  "media-workspace": "สื่อและจอแสดงผล",
};

// Exact tone hex values from the Figma mockup (node 396:4660) — each
// workspace gets its own tinted card, icon chip, and CTA button color.
// "Media"'s title deliberately stays navy (not purple) in the mockup even
// though its icon/button are purple — kept as-is rather than "fixed".
const TONES: Record<
  string,
  { cardTo: string; border: string; chipBg: string; iconColor: string; titleColor: string; buttonBg: string; buttonText: string }
> = {
  people: {
    cardTo: "to-accent",
    border: "border-border",
    chipBg: "bg-accent",
    iconColor: "text-primary",
    titleColor: "text-primary",
    buttonBg: "bg-accent hover:bg-t1-blue-50",
    buttonText: "text-primary",
  },
  "asset-intelligence": {
    cardTo: "to-success-muted",
    border: "border-border",
    chipBg: "bg-success-muted",
    iconColor: "text-t1-green-700",
    titleColor: "text-t1-green-700",
    buttonBg: "bg-success-muted hover:bg-success/20",
    buttonText: "text-t1-green-700",
  },
  "media-workspace": {
    cardTo: "to-in-progress-muted",
    border: "border-border",
    chipBg: "bg-in-progress-muted",
    iconColor: "text-t1-purple-700",
    titleColor: "text-foreground",
    buttonBg: "bg-in-progress-muted hover:bg-in-progress/20",
    buttonText: "text-t1-purple-700",
  },
};

const ORDER = ["people", "asset-intelligence", "media-workspace"];

// `allowedAppIds` — config/tenant-access.ts; null shows all three cards.
export function WorkspaceCardsRow({ allowedAppIds }: { allowedAppIds: ReadonlySet<string> | null }) {
  const apps = ORDER.filter((id) => canOpenApp(allowedAppIds, id))
    .map((id) => APPS.find((app) => app.id === id))
    .filter((app): app is NonNullable<typeof app> => Boolean(app));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-foreground">พื้นที่ทำงานของคุณ</h2>
        <Link
          href="/work-space"
          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-accent-foreground"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {apps.map((app) => {
          const tone = TONES[app.id];
          return (
            // The whole card is the link (not just the button) — a Link
            // can't nest another Link, so "เปิดใช้งาน" below is a plain
            // span styled like a button, and the hover/lift feedback lives
            // on this outer element so it's clear the whole tile is clickable.
            <Link
              key={app.id}
              href={app.basePath}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col gap-3 rounded-[10px] border bg-gradient-to-br from-t1-white p-[22px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${tone.border} ${tone.cardTo}`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] ${tone.chipBg} ${tone.iconColor} transition-transform duration-200 group-hover:scale-105 [&>svg]:h-6 [&>svg]:w-6`}>
                  {app.icon}
                </span>
                <div>
                  <p className={`text-lg font-black tracking-tight ${tone.titleColor}`}>{TITLES[app.id]}</p>
                  <p className="text-sm text-muted-foreground">{SUBLABELS[app.id]}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{DESCRIPTIONS[app.id]}</p>
              <span
                className={`mt-auto flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-center text-sm font-bold ${tone.buttonBg} ${tone.buttonText}`}
              >
                เปิดใช้งาน
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
