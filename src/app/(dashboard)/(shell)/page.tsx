import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

// Thunder One's shell root. Personalized-per-role landing is the target
// (docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md, step 2), but
// that needs real RBAC first (docs/adr/0021-role-vocabulary-reconciliation.md,
// still unmerged on docs/rbac-role-vocabulary-adr) — this is the
// non-personalized placeholder the ADR calls for in the meantime.
export default function ShellHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thunder One"
        subtitle="Not personalized yet — every user sees this same landing page until role-based routing lands."
      />
      <Card className="p-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Head into <strong>Work Space</strong> to reach Communication, Asset Intelligence, or
          ThunderCare, or jump straight to one of the shell-level sections below.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href="/work-space"
            className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
          >
            Work Space
          </Link>
          <Link
            href="/mission-control"
            className="rounded-xl border border-zinc-200 p-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Mission Control
          </Link>
          <Link
            href="/my-work"
            className="rounded-xl border border-zinc-200 p-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            My Work
          </Link>
          <Link
            href="/intelligence"
            className="rounded-xl border border-zinc-200 p-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Intelligence
          </Link>
        </div>
      </Card>
    </div>
  );
}
