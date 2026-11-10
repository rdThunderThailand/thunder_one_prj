export function assignmentErrorText(code: string) {
  switch (code) {
    case "VALIDATION": return { title: "Check assignment filters", body: "These filters are invalid. Clear the filters and try again." };
    case "UNAUTHENTICATED": return { title: "Sign in required", body: "Your session has expired. Sign in again to view assignments." };
    case "PERMISSION_DENIED": return { title: "You don't have access", body: "You don't have permission to view assignments in this organization." };
    case "NOT_FOUND": return { title: "Assignments unavailable", body: "Assignments could not be found for this organization." };
    default: return { title: "Couldn't load assignments", body: "Assignments could not be loaded. Check your connection and retry." };
  }
}

type CustodyAction = "assign" | "transfer" | "return";
const noun: Record<CustodyAction, string> = { assign: "assignment", transfer: "transfer", return: "return" };
const checks: Record<CustodyAction, string> = {
  assign: "the custodian, reason and attachments", transfer: "the custodian, condition, location, reason and attachments",
  return: "the condition, reason and attachments",
};

/** FE 02–04 writes and their page reads: plain sentences chosen by Core `code`, never by message. */
export function assignmentWriteText(code: string, uncertain = false, action: CustodyAction = "assign") {
  if (uncertain) return `The ${noun[action]} may have been saved. Reload to check before trying again.`;
  switch (code) {
    case "STALE": return "This asset was changed by someone else. Reload to see the latest.";
    case "INVALID_STATE": return "This asset's status changed. Reload to see the latest.";
    case "PERMISSION_DENIED": return `You don't have permission to ${action} assets in this organization.`;
    case "UNAUTHENTICATED": return "Your session has expired. Sign in again, then retry.";
    case "NOT_FOUND": return action === "return" ? "The asset is no longer available. Reload to check."
      : "The asset or the chosen custodian is no longer available. Reload and choose again.";
    case "VALIDATION": return `Some details were rejected. Check ${checks[action]}.`;
    default: return `The ${noun[action]} couldn't be saved. Check your connection and try again.`;
  }
}
