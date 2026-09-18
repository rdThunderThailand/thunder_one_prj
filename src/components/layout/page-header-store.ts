import type { ReactNode } from "react";

// Lets `PageHeader` (rendered deep inside `main`) hand its title to the
// Topbar (docs/adr/0075 §4) without prop-drilling through the whole shell.
// A plain module store + `useSyncExternalStore`, not React state set from an
// effect — the repo's ESLint rule bans synchronous `setState` in a `useEffect`
// body, and this never calls a component's own setState from its own effect.

export interface PageHeaderMeta {
  title: ReactNode;
  subtitle?: string;
}

let current: PageHeaderMeta | null = null;
const listeners = new Set<() => void>();

export function publishPageHeader(meta: PageHeaderMeta | null) {
  current = meta;
  listeners.forEach((listener) => listener());
}

export function subscribePageHeader(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPageHeaderSnapshot() {
  return current;
}
