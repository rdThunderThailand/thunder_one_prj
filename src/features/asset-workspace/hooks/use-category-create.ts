import { useEffect, useRef, useState } from "react";
import { emptyCategoryDraft, validateCategoryDraft, type CategoryDraft, type CategoryField, type CategoryFormErrors } from "../domain/category-form";
import { createAssetCategory, type CategoryCreateFailure } from "../services/asset-category-create";

export function useCategoryCreate(context: string, refreshParents: () => void) {
  const [draft, setDraft] = useState<CategoryDraft>({ ...emptyCategoryDraft });
  const [fields, setFields] = useState<CategoryFormErrors>({});
  const [failure, setFailure] = useState<CategoryCreateFailure | null>(null);
  const [phase, setPhase] = useState<"idle" | "submitting" | "uncertain" | "success">("idle");
  const flight = useRef(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    if (phase !== "submitting" && phase !== "uncertain") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  function patch(updates: Partial<CategoryDraft>) {
    if (phase !== "idle" || flight.current) return;
    const next = { ...draft, ...updates };
    setDraft(next);
    const validation = validateCategoryDraft(next);
    setFields((previous) => {
      const remaining = { ...previous };
      for (const key of Object.keys(updates) as CategoryField[]) {
        if (validation.ok || !validation.fields[key]) delete remaining[key];
      }
      return remaining;
    });
    setFailure(null);
  }

  function blur(field: CategoryField) {
    if (phase !== "idle") return;
    const validation = validateCategoryDraft(draft);
    setFields((previous) => ({ ...previous, [field]: validation.ok ? undefined : validation.fields[field] }));
  }

  async function submit() {
    if (flight.current || phase !== "idle") return null;
    const validation = validateCategoryDraft(draft);
    setFields(validation.ok ? {} : validation.fields);
    setFailure(null);
    if (!validation.ok) return null;
    flight.current = true;
    setPhase("submitting");
    const abort = new AbortController();
    controller.current = abort;
    const result = await createAssetCategory(context, validation.input, abort.signal);
    if (!mounted.current) return null;
    if (result.ok) {
      setPhase("success");
      return result.data;
    }
    flight.current = result.uncertain;
    setPhase(result.uncertain ? "uncertain" : "idle");
    setFields(result.fields);
    setFailure(result);
    if (result.code === "INVALID_PARENT") refreshParents();
    return null;
  }

  return { draft, fields, failure, phase, locked: phase !== "idle", patch, blur, submit };
}
export type CategoryCreateFlow = ReturnType<typeof useCategoryCreate>;
