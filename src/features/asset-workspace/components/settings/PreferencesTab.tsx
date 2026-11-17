import { EmptyState } from "../states/states";

/** Workspace Preferences (05 §4.12.4): stores nothing until the PO answers D15 (org default or personal preference). */
export function PreferencesTab() {
  return (
    <EmptyState
      title="Not available yet"
      body="Workspace preferences appear here once the product team confirms which ones are organization defaults."
    />
  );
}
