export type ReleaseStatus = "not_approved" | "approved" | "withdrawn";

type Filterable = { display_name: string; version: string; admitted: { status: "ready" | "revoked" } | null };

export const STATUS_LABELS: Record<ReleaseStatus, string> = {
  not_approved: "Not approved",
  approved: "Approved",
  withdrawn: "Withdrawn",
};

/** ADR 0028 §11 amendment 3 item 1: Withdrawn is hidden until asked for. */
export const DEFAULT_STATUSES: ReleaseStatus[] = ["not_approved", "approved"];

export function releaseStatus(release: Filterable): ReleaseStatus {
  if (!release.admitted) return "not_approved";
  return release.admitted.status === "revoked" ? "withdrawn" : "approved";
}

/** Matches name or version; returns the shown rows and how many Withdrawn rows the filter hides. */
export function filterReleases<T extends Filterable>(releases: T[], text: string, statuses: ReleaseStatus[]) {
  const query = text.trim().toLowerCase();
  const matching = releases.filter((release) =>
    !query || release.display_name.toLowerCase().includes(query) || release.version.includes(query));
  const shown = matching.filter((release) => statuses.includes(releaseStatus(release)));
  const hiddenWithdrawn = statuses.includes("withdrawn")
    ? 0
    : matching.filter((release) => releaseStatus(release) === "withdrawn").length;
  return { shown, hiddenWithdrawn };
}
