import { useEffect, useState } from "react";
import type { AssetCategory, CategoryReadResult } from "../domain/asset-category";
import { getCategories } from "../services/asset-categories-api";

interface Snapshot {
  context: string;
  version: number;
  result: CategoryReadResult<AssetCategory[]>;
}

export function useCategoryListData(context: string) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void getCategories(context, controller.signal).then((result) => {
      if (alive) setSnapshot({ context, version, result });
    }).catch(() => {
      if (alive && !controller.signal.aborted) {
        setSnapshot({ context, version, result: {
          ok: false, status: 503, message: "Categories could not be loaded. Retry this section.",
        } });
      }
    });
    return () => { alive = false; controller.abort(); };
  }, [context, version]);

  const current = snapshot?.context === context && snapshot.version === version ? snapshot.result : null;
  return {
    data: current?.ok ? current.data : null,
    error: current && !current.ok ? current : null,
    pending: current === null,
    retry: () => setVersion((value) => value + 1),
  };
}
