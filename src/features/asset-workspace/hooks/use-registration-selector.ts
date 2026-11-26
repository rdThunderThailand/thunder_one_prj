import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRegistrationReferences } from "../services/registration-selector-client";
import type { RegistrationOptions } from "../services/asset-registration-contract";
import type { ReferenceItem, SelectorKind, SelectorPage } from "../services/registration-selector-contract";

interface Results { items: ReferenceItem[]; busy: boolean; error: string; page: SelectorPage | null }
const empty = (): Results => ({ items: [], busy: false, error: "", page: null });
export function useRegistrationSelector(context: string, kind: SelectorKind, rules: RegistrationOptions["referenceSelectors"], enabled = true) {
  const [search, setSearch] = useState("");
  const [trail, setTrail] = useState<ReferenceItem[]>([]);
  const [result, setResult] = useState<Results>(empty);
  const latest = useRef<Results>(empty());
  const cache = useRef(new Map<string, Results>());
  const request = useRef<AbortController | null>(null);
  const query = search.trim();
  const parent = query ? undefined : trail.at(-1)?.id;
  const key = `${context}:${kind}:${query}:${parent ?? "root"}:${rules.pageSize}`;

  const load = useCallback(async (more: boolean, controller: AbortController) => {
    const previous = more ? latest.current : empty();
    let items = previous.items;
    let page = previous.page;
    const seen = new Set<string>();
    const publish = (next: Results) => { if (!controller.signal.aborted) { latest.current = next; setResult(next); } };
    publish({ ...previous, busy: true, error: "" });
    try {
      do {
        const cursor = kind === "persons" ? page?.nextCursor ?? undefined : undefined;
        const number = kind === "persons" ? undefined : page?.nextPage ?? 1;
        if (cursor && seen.has(cursor)) throw new Error("Search continuation did not advance. Restart this search.");
        if (cursor) seen.add(cursor);
        page = await fetchRegistrationReferences(context, {
          kind, page_size: rules.pageSize, ...(query ? { q: query } : parent ? { parent_id: parent } : {}),
          ...(kind === "persons" ? { cursor } : { page: number }),
        }, controller.signal);
        if (controller.signal.aborted) return;
        if (kind === "persons" ? page.hasMore && page.nextCursor === cursor : page.page !== number) {
          throw new Error("Search continuation did not advance. Enter a new search or reopen this selector.");
        }
        const byId = new Map(items.map((item) => [item.id, item]));
        for (const item of page.items) byId.set(item.id, item);
        items = [...byId.values()];
        publish({ items, page, busy: kind === "persons" && !items.length && page.hasMore, error: "" });
      } while (kind === "persons" && !items.length && page.hasMore);
      const next = { items, page, busy: false, error: "" };
      cache.current.set(key, next);
      publish(next);
    } catch (error) {
      if (!controller.signal.aborted) publish({ items, page, busy: false, error: error instanceof Error ? error.message : "Could not load references. Try again." });
    }
  }, [context, kind, rules.pageSize, query, parent, key]);

  useEffect(() => {
    request.current?.abort();
    if (!enabled) return;
    const controller = new AbortController();
    request.current = controller;
    const cached = cache.current.get(key);
    latest.current = cached ?? { ...empty(), busy: true };
    setResult(latest.current);
    const timer = cached ? undefined : setTimeout(() => { void load(false, controller); }, query ? rules.search.debounceMs : 0);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [key, enabled, query, rules.search.debounceMs, load]);

  function more() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    void load(Boolean(latest.current.page?.hasMore), controller);
  }
  function cancel() {
    request.current?.abort();
    latest.current = { ...latest.current, busy: false, error: "Search paused. Continue searching or enter another name." };
    setResult(latest.current);
  }
  function browse(item: ReferenceItem) {
    setSearch("");
    setTrail((previous) => query ? [item] : [...previous, item]);
  }
  return { ...result, search, setSearch, trail, browse, more, cancel,
    back: () => { setSearch(""); setTrail((previous) => previous.slice(0, -1)); },
    root: () => { setSearch(""); setTrail([]); },
    finalEmpty: !result.busy && !result.error && !result.items.length && Boolean(result.page)
      && (kind !== "persons" || result.page?.searchComplete === true),
  };
}
export type RegistrationSelector = ReturnType<typeof useRegistrationSelector>;
