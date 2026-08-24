import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { APPS } from "@/config/apps";

// The launcher into every App — a real page, not a dropdown, so it scales
// past three tiles — docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
export default function WorkSpacePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Work Space" subtitle="Choose an App to open." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <Link key={app.id} href={app.basePath}>
            <Card className="flex h-full flex-col gap-3 p-6 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                {app.icon}
              </span>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{app.label}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {app.tagline}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
