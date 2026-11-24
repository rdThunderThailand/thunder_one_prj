/** Copy for the Edit page's AlertDialog, keyed by the pending action. */
export const CONFIRM_COPY = {
  discard: {
    title: "Discard changes?",
    body: "You have unsaved changes. Are you sure you want to leave this page?",
    action: "Discard",
  },
  end: {
    title: "End this Program?",
    body: "It stops playing on every screen and cannot be restarted. Duplicate it to air it again.",
    action: "End program",
  },
  delete: {
    title: "Delete this Program?",
    body: "The draft is removed permanently.",
    action: "Delete",
  },
} as const;
