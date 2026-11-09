import { useEffect, useState } from "react";
import { getCategory } from "../services/asset-categories-api";

/** A rolled-up parent may not be in assets/filters, which lists direct assignments only. */
export function useCategoryFilterLabel(context: string, categoryId: string | undefined, needed: boolean) {
  const [snapshot, setSnapshot] = useState<{ context: string; id: string; name: string } | null>(null);

  useEffect(() => {
    if (!categoryId || !needed) return;
    let alive = true;
    const controller = new AbortController();
    void getCategory(context, categoryId, controller.signal).then((result) => {
      if (alive) setSnapshot({ context, id: categoryId, name: result.ok ? result.data.name : "Selected category" });
    }).catch(() => {
      if (alive && !controller.signal.aborted) setSnapshot({ context, id: categoryId, name: "Selected category" });
    });
    return () => { alive = false; controller.abort(); };
  }, [context, categoryId, needed]);

  if (!categoryId || !needed) return undefined;
  return {
    id: categoryId,
    name: snapshot?.context === context && snapshot.id === categoryId ? snapshot.name : "Selected category",
  };
}
