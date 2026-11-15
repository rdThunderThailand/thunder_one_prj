"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition, type KeyboardEvent } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlusIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { LW_BASE, LW_TABS, type LwTab } from "../../domain/lifecycle-list";

/** FE 01: title row and the Lifecycle | Warranty tabs. A tab switch replaces `?tab=` and drops the other tab's filters
 *  (both tabs use `status` and `q`, with different values). */
export function LwHeader({ tab }: { tab: LwTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function select(next: LwTab) {
    if (next === tab) return;
    startTransition(() => router.replace(`${pathname}?tab=${next}`, { scroll: false }));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = LW_TABS.length;
    const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1
      : event.key === "ArrowRight" ? (index + 1) % count
        : event.key === "ArrowLeft" ? (index + count - 1) % count : null;
    if (next === null) return;
    event.preventDefault();
    buttons.current[next]?.focus();
    select(LW_TABS[next].key);
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Lifecycle & Warranty"
          subtitle="Track asset status, condition and warranty coverage."
        />
        {tab === "warranty" && (
          <Button asChild variant="primary" size="sm" className="max-sm:h-10">
            <Link href={`${LW_BASE}/warranty/new`}>
              <PlusIcon aria-hidden="true" className="size-4" />
              Add Warranty
            </Link>
          </Button>
        )}
      </div>
      <div role="tablist" aria-label="Lifecycle & Warranty views" aria-busy={pending} className="flex gap-1 border-b border-border">
        {LW_TABS.map((item, index) => (
          <button
            key={item.key}
            ref={(button) => { buttons.current[index] = button; }}
            id={`lw-tab-${item.key}`}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            aria-controls="lw-panel"
            tabIndex={tab === item.key ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => select(item.key)}
            className={`min-h-10 border-b-2 px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none ${
              tab === item.key ? "border-primary text-accent-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
