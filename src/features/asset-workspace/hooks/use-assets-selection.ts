import { useState } from "react";

/** Selection remains limited to the current query/page, shared by both action menus. */
export function useAssetsSelection(key: string, rows: readonly { id: string }[]) {
  const [state, setState] = useState({ key, ids: new Set<string>() });
  const visible = new Set(rows.map((row) => row.id));
  const selected = new Set([...state.ids].filter((id) => visible.has(id)));
  if (state.key !== key || selected.size !== state.ids.size) {
    setState({ key, ids: state.key !== key ? new Set() : selected });
  }
  const current = state.key === key ? selected : new Set<string>();
  return {
    selected: current,
    clear: () => setState({ key, ids: new Set() }),
    selectAll: (checked: boolean) => setState({ key, ids: checked ? new Set(rows.map((row) => row.id)) : new Set() }),
    select: (id: string, checked: boolean) => setState((previous) => {
      const ids = new Set(previous.key === key ? previous.ids : []);
      if (checked && visible.has(id)) ids.add(id); else ids.delete(id);
      return { key, ids };
    }),
  };
}

export type AssetsSelection = ReturnType<typeof useAssetsSelection>;
