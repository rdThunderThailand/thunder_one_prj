import type { Dispatch, SetStateAction } from "react";

// Shared field styling + inline-error rendering for the add-person wizards
// (Employee/Contractor/Bulk) — they use raw <input>/<select>/<textarea>
// rather than the shared components/ui/Input, so each field's error state
// is threaded through explicitly instead of via a prop.
export const inputClasses =
  "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const labelClasses = "flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

export function fieldClasses(hasError: boolean): string {
  return hasError ? `${inputClasses} border-red-400 focus:border-red-500` : inputClasses;
}

export function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

/** Removes one field's error once the user edits it, so the message clears
 *  immediately on the next keystroke rather than lingering until re-validation. */
export function clearFieldError(
  setErrors: Dispatch<SetStateAction<Record<string, string>>>,
  key: string
) {
  setErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}
