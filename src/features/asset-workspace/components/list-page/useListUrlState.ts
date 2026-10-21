"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/** Filters, tab and page live in the URL so they survive a reload and the server page can
 *  fetch with them. Changing anything but `page` sends the list back to page 1.
 *  `isPending` is true while the server re-renders, so the scaffold can show Loading. */
export type ListUrlState = ReturnType<typeof useListUrlState>;

export function useListUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function get(key: string): string | undefined {
    return searchParams.get(key) ?? undefined;
  }

  function set(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in updates)) params.delete("page");
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return { get, set, isPending };
}
