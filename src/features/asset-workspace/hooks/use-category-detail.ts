import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AssetCategoryDetail, CategoryReadResult, CategoryStatus } from "../domain/asset-category";
import { getCategory } from "../services/asset-categories-api";
import { setAssetCategoryStatus, type CategoryStatusFailure } from "../services/asset-category-status";

interface Snapshot {
  version: number;
  result: CategoryReadResult<AssetCategoryDetail>;
}

/** The route keys this hook's owner by tenant, user and category ID. */
export function useCategoryDetail(context: string, id: string) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<CategoryStatusFailure | null>(null);
  const flight = useRef(false);
  const mounted = useRef(true);
  const mutation = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutation.current?.abort(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    void getCategory(context, id, controller.signal).then((result) => {
      if (alive) setSnapshot({ version, result });
    }).catch(() => {
      if (alive && !controller.signal.aborted) setSnapshot({ version, result: {
        ok: false, status: 503, message: "The category could not be loaded. Check your connection and retry.",
      } });
    });
    return () => { alive = false; controller.abort(); };
  }, [context, id, version]);

  useEffect(() => {
    if (!sending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [sending]);

  const pending = snapshot === null || snapshot.version !== version;
  const result = snapshot?.result;
  const data = result?.ok ? result.data : null;
  const error = result && !result.ok && !pending ? result : null;

  function retry() {
    if (!flight.current) setVersion((value) => value + 1);
  }

  async function changeStatus(status: CategoryStatus) {
    if (flight.current || pending || !data) return;
    flight.current = true;
    setSending(true);
    setFailure(null);
    const controller = new AbortController();
    mutation.current = controller;
    const changed = await setAssetCategoryStatus(context, data, status, controller.signal);
    if (!mounted.current) return;
    flight.current = false;
    setSending(false);
    if (changed.ok) {
      setSnapshot({ version, result: { ok: true, data: changed.data } });
      toast.success(`${changed.data.name} is ${changed.data.status.toLowerCase()}.`);
    } else {
      setFailure(changed);
      if (changed.uncertain || changed.code === "STALE") setVersion((value) => value + 1);
    }
  }

  return { data, error, pending, sending, failure, retry, changeStatus };
}
