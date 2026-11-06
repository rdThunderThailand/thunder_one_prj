// Step 5 confirmation: progress stages and what each failure tells the user to do next.

export type RegistrationStage = "checking" | "uploading" | "creating" | "recovering";

export interface RegistrationFailure {
  code?: string; status?: number; details?: unknown;
  /** The create may have committed: only "retry the original request" is safe. */
  uncertain: boolean;
  message: string;
}

export interface SerialDuplicate { id: string; assetTag: string | null; name: string }

/** "retry": run the confirmation again (the same submission id never creates a second asset).
 *  "override": open the duplicate-serial override. "edit": close and review the form. */
export type OutcomeAction = "retry" | "override" | "edit" | "close";

export interface RegistrationOutcome {
  tone: "warning" | "error" | "info";
  title: string;
  body: string;
  primary: OutcomeAction;
  secondary?: OutcomeAction;
  duplicates?: SerialDuplicate[];
}

function duplicates(details: unknown): SerialDuplicate[] {
  if (!Array.isArray(details)) return [];
  return details.filter((item): item is SerialDuplicate => typeof item === "object" && item !== null
    && typeof (item as SerialDuplicate).id === "string" && typeof (item as SerialDuplicate).name === "string")
    .map(({ id, assetTag, name }) => ({ id, assetTag: typeof assetTag === "string" ? assetTag : null, name }));
}

export function registrationOutcome(failure: RegistrationFailure, canOverride: boolean): RegistrationOutcome {
  const { code, status, message } = failure;
  if (failure.uncertain) {
    return {
      tone: "warning", title: "We couldn't confirm the result",
      body: "The asset may already have been created. Retry to recover the original result; it never creates a second asset. Editing stays locked until then.",
      primary: "retry", secondary: "close",
    };
  }
  if (code === "SERIAL_DUPLICATE") {
    return {
      tone: "warning", title: "This Serial Number is already used",
      body: canOverride ? "Correct the Serial Number, or continue with an override and give a reason. The reason is recorded."
        : "Correct the Serial Number before creating the asset.",
      primary: canOverride ? "override" : "edit", secondary: canOverride ? "edit" : "close",
      duplicates: duplicates(failure.details),
    };
  }
  if (code === "UPLOAD_EXPIRED" || code === "NOT_FOUND" || code === "UPLOAD_RETRY") {
    return {
      tone: "warning", title: code === "UPLOAD_RETRY" ? "A file upload didn't finish" : "A selected file is no longer available",
      body: message, primary: code === "UPLOAD_RETRY" ? "retry" : "edit", secondary: "close",
    };
  }
  if (code === "REGISTRATION_UNAVAILABLE" || code === "REGISTRATION_UPLOAD_UNAVAILABLE") {
    return { tone: "info", title: "Creation is temporarily unavailable", body: message, primary: "close" };
  }
  if (status === 401 || status === 403) {
    return { tone: "error", title: "Your access changed", body: message, primary: "close" };
  }
  if (code === "INVALID_STATE") {
    return { tone: "error", title: "This conflicts with an existing record", body: message, primary: "edit" };
  }
  if (code === "VALIDATION" || status === 400) {
    return { tone: "error", title: "Some information was rejected", body: message, primary: "edit" };
  }
  if (code === "CONNECTION_FAILED" || (status ?? 0) >= 500) {
    return { tone: "error", title: "The asset service couldn't be reached", body: message, primary: "retry", secondary: "close" };
  }
  // Checks before anything is sent: a highlighted step, missing files, unavailable uploads.
  return { tone: "warning", title: "Check your registration", body: message, primary: "edit" };
}

/** 0–100 for the progress bar: checks, then uploads by file, then the create itself. */
export function registrationProgress(stage: RegistrationStage | null, filesDone: number, filesTotal: number): number {
  if (stage === "checking" || stage === null) return 8;
  if (stage === "uploading") return filesTotal ? Math.round(15 + (filesDone / filesTotal) * 65) : 80;
  return 90;
}
