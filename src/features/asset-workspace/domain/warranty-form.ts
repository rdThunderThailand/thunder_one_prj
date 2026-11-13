// Add / Edit Warranty form rules (batch FE 04; limits match Core BE 01 `asset_warranty_check`).
import { isCalendarDate } from "./registration-warranty-dates.ts";

export const WARRANTY_LIMITS = { provider: 200, type: 250, referenceNo: 100, coverageNote: 500 } as const;
export const WARRANTY_DOCUMENTS_MAX = 2;
export const ADD_WARRANTY_TITLE = "Add Warranty";
export const EDIT_WARRANTY_TITLE = "Edit Warranty";
export const DISPOSED_WARRANTY_TEXT = "This asset is disposed. Its warranty is view only.";

export type WarrantyDraft = {
  provider: string; type: string; startDate: string; endDate: string; referenceNo: string; coverageNote: string;
  /** Add only. */
  makeCurrent: boolean;
};

export const emptyWarrantyDraft = (hasCurrent: boolean): WarrantyDraft => ({
  provider: "", type: "", startDate: "", endDate: "", referenceNo: "", coverageNote: "",
  // Q16: ticked when the asset has no current warranty.
  makeCurrent: !hasCurrent,
});

export const draftFromRecord = (record: {
  provider: string | null; type: string | null; startDate: string | null; endDate: string | null;
  referenceNo: string | null; coverageNote: string | null;
}): WarrantyDraft => ({
  provider: record.provider ?? "", type: record.type ?? "", startDate: record.startDate ?? "", endDate: record.endDate ?? "",
  referenceNo: record.referenceNo ?? "", coverageNote: record.coverageNote ?? "", makeCurrent: false,
});

const tooLong = (value: string, max: number) => value.trim().length > max ? `Enter ${max} characters or fewer.` : null;

/** Field errors; all null means Next is allowed. Older records missing dates must get them (Q25). */
export function warrantyErrors(draft: WarrantyDraft) {
  const start = isCalendarDate(draft.startDate);
  const end = isCalendarDate(draft.endDate);
  return {
    provider: !draft.provider.trim() ? "Enter the provider." : tooLong(draft.provider, WARRANTY_LIMITS.provider),
    type: !draft.type.trim() ? "Enter the warranty type." : tooLong(draft.type, WARRANTY_LIMITS.type),
    startDate: !draft.startDate ? "Choose the start date." : start ? null : "Enter a date as dd/mm/yyyy.",
    endDate: !draft.endDate ? "Choose the end date." : !end ? "Enter a date as dd/mm/yyyy."
      : start && draft.endDate < draft.startDate ? "End Date can't be before Start Date." : null,
    referenceNo: tooLong(draft.referenceNo, WARRANTY_LIMITS.referenceNo),
    coverageNote: tooLong(draft.coverageNote, WARRANTY_LIMITS.coverageNote),
  };
}

const fields = (draft: WarrantyDraft, fileIds: string[]) => {
  const referenceNo = draft.referenceNo.trim();
  const coverageNote = draft.coverageNote.trim();
  return {
    provider: draft.provider.trim(),
    warrantyType: draft.type.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    referenceNo: referenceNo || null,
    coverageNote: coverageNote || null,
    ...(fileIds.length && { fileIds }),
  };
};

/** POST body; `expectedCurrentId` is the current warranty the user saw (null = none). */
export const addWarrantyBody = (draft: WarrantyDraft, fileIds: string[], expectedCurrentId: string | null) =>
  ({ ...fields(draft, fileIds), makeCurrent: draft.makeCurrent, expectedCurrentId });

/** PATCH body; every field is sent again, `fileIds` only adds documents. */
export const updateWarrantyBody = (draft: WarrantyDraft, fileIds: string[], expectedUpdatedAt: string) =>
  ({ ...fields(draft, fileIds), expectedUpdatedAt });

/** Q28: which failures keep the input and offer Reload. */
export function warrantyWriteText(code?: string, uncertain = false) {
  if (uncertain) return "The warranty may have been saved. Reload to check before trying again.";
  switch (code) {
    case "STALE": return "Someone changed this warranty. Reload to see the latest; your input is kept until then.";
    case "INVALID_STATE": return DISPOSED_WARRANTY_TEXT;
    case "VALIDATION": return "Some details were rejected. Check the fields and attachments.";
    case "PERMISSION_DENIED": return "Only Asset Admins can change warranties.";
    case "UNAUTHENTICATED": return "Your session has expired. Sign in again, then retry.";
    case "NOT_FOUND": return "This asset or warranty is no longer available. Reload to check.";
    default: return "The warranty couldn't be saved. Check your connection and try again.";
  }
}

export const warrantyNeedsReload = (code?: string, uncertain = false) =>
  uncertain || code === "STALE" || code === "NOT_FOUND" || code === "INVALID_STATE";

export const WARRANTY_SUBTITLE = "Record the warranty provider, coverage period and documents for this asset.";
/** Q23: the list route adds a Select Asset step first. */
export const warrantySteps = (select: boolean) =>
  [...(select ? ["Select Asset"] : []), "Warranty Information", "Review", "Result"];
