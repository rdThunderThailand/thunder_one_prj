export function assignmentErrorText(code: string) {
  switch (code) {
    case "VALIDATION": return { title: "Check assignment filters", body: "These filters are invalid. Clear the filters and try again." };
    case "UNAUTHENTICATED": return { title: "Sign in required", body: "Your session has expired. Sign in again to view assignments." };
    case "PERMISSION_DENIED": return { title: "You don't have access", body: "You don't have permission to view assignments in this organization." };
    case "NOT_FOUND": return { title: "Assignments unavailable", body: "Assignments could not be found for this organization." };
    default: return { title: "Couldn't load assignments", body: "Assignments could not be loaded. Check your connection and retry." };
  }
}
