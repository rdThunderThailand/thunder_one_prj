import { useEffect, useRef, useState } from "react";
import type { AssetCategoryDetail } from "../domain/asset-category";
import { categoryEditDraft, categoryEditPatch } from "../domain/category-edit";
import type { CategoryDraft, CategoryFormErrors } from "../domain/category-form";
import { updateAssetCategory, type CategoryEditFailure } from "../services/asset-category-edit";

export function useCategoryEdit(context: string, category: AssetCategoryDetail, reloadParents: () => void) {
  const [draft, setDraft] = useState(() => categoryEditDraft(category));
  const [fields, setFields] = useState<CategoryFormErrors>({});
  const [failure, setFailure] = useState<CategoryEditFailure | null>(null);
  const [phase, setPhase] = useState<"idle" | "sending" | "uncertain" | "success">("idle");
  const flight = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    if (phase !== "sending" && phase !== "uncertain") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);
  const validation = categoryEditPatch(category, draft);
  const locked = phase !== "idle";
  function patch(changes: Partial<CategoryDraft>) {
    if (locked || flight.current) return;
    setDraft((previous) => ({ ...previous, ...changes }));
    setFields((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(changes) as (keyof CategoryDraft)[]) delete next[key];
      return next;
    });
  }
  async function submit() {
    if (locked || flight.current || failure?.code === "STALE") return null;
    if (!validation.ok) { setFields(validation.fields); return null; }
    if (!validation.dirty) return null;
    flight.current = true;
    setPhase("sending");
    setFailure(null);
    setFields({});
    const abort = new AbortController();
    controller.current = abort;
    const result = await updateAssetCategory(context, category.id, validation.input, abort.signal);
    if (!mounted.current) return null;
    if (result.ok) { setPhase("success"); return result.data; }
    flight.current = result.uncertain;
    setPhase(result.uncertain ? "uncertain" : "idle");
    setFailure(result);
    setFields(result.fields);
    if (result.code === "INVALID_PARENT" || result.code === "HIERARCHY_LOOP") reloadParents();
    return null;
  }
  return { draft, fields, failure, phase, locked, patch, submit,
    canSave: !locked && failure?.code !== "STALE" && (!validation.ok || validation.dirty) };
}
