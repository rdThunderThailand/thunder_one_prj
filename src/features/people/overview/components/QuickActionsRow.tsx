import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import {
  ChartIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PlusIcon,
  RepeatIcon,
  UserMinusIcon,
} from "@/components/ui/icons";

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: ReactNode;
  /** No `href` means no page backs the action yet; it renders inert. */
  href?: string;
}

// Each action links to the page that handles it. โอนย้าย/เปลี่ยนผู้จัดการ go to
// การเปลี่ยนแปลง and Offboarding to ออกจากองค์กร; those two pages still show
// mock data until Core's Change/Offboarding API lands (Phase 1B).
// สร้างรายงาน stays inert: there is no report backend.
const quickActions: QuickAction[] = [
  {
    id: "add-employee",
    label: "เพิ่มพนักงานใหม่",
    sublabel: "เริ่ม Onboarding",
    icon: <PlusIcon className="h-4 w-4" />,
    href: "/people/add/employee",
  },
  {
    id: "invite-person",
    label: "เชิญบุคคลเข้าร่วม",
    sublabel: "Partner / Guest / Contractor",
    icon: <EnvelopeIcon className="h-4 w-4" />,
    href: "/people/add",
  },
  {
    id: "transfer-employee",
    label: "โอนย้ายพนักงาน",
    sublabel: "เปลี่ยนทีม / แผนก",
    icon: <RepeatIcon className="h-4 w-4" />,
    href: "/people/changes",
  },
  {
    id: "change-manager",
    label: "เปลี่ยนผู้จัดการ",
    sublabel: "Update Reporting",
    icon: <CheckCircleIcon className="h-4 w-4" />,
    href: "/people/changes",
  },
  {
    id: "start-offboarding",
    label: "เริ่ม Offboarding",
    sublabel: "พนักงานออกจากองค์กร",
    icon: <UserMinusIcon className="h-4 w-4" />,
    href: "/people/departures",
  },
  {
    id: "create-report",
    label: "สร้างรายงาน",
    sublabel: "People Report",
    icon: <ChartIcon className="h-4 w-4" />,
  },
];

const tileClasses = "flex items-center gap-2.5 rounded-xl border border-border p-3 text-left";

function QuickActionContent({ action }: { action: QuickAction }) {
  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">
          {action.label}
        </span>
        <span className="block truncate text-[11px] text-t1-gray-400">{action.sublabel}</span>
      </span>
    </>
  );
}

export function QuickActionsRow() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">ทางลัด (Quick Actions)</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) =>
          action.href ? (
            <Link
              key={action.id}
              href={action.href}
              className={`${tileClasses} transition-colors hover:border-primary hover:bg-accent`}
            >
              <QuickActionContent action={action} />
            </Link>
          ) : (
            <span
              key={action.id}
              title="Not built yet"
              className={`${tileClasses} cursor-not-allowed opacity-70`}
            >
              <QuickActionContent action={action} />
            </span>
          )
        )}
      </div>
    </Card>
  );
}
