"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { MoreIcon } from "@/components/ui/icons";
import { admitPlayerRelease, deletePlayerRelease, revokePlayerRelease } from "./actions";
import { formatTime } from "./device-state";
import { megabytes, ReleaseDetails } from "./release-details";
import { releaseStatus, STATUS_LABELS } from "./release-filter";
import { ReleaseRenameDialog } from "./release-rename-dialog";

type Release = {
  id: string;
  display_name: string;
  version: string;
  created_at: string;
  files: { name: string; size: number; sha256: string }[];
  admitted: { id: string; status: "ready" | "revoked"; admitted_at: string } | null;
};
type Result = { data: unknown } | { error: string };

const BADGE = { not_approved: "neutral", approved: "success", withdrawn: "danger" } as const;
const CONFIRM = {
  delete: "Files are removed and the version can be uploaded again. This cannot be undone.",
  withdraw: "Devices stop installing this release and discard a pending download of it. If it is the version set for the test group, that version is cleared. This cannot be undone.",
};

/**
 * ADR 0028 §11 amendment 3: one release row. Status and test-group badges in the row, every action in the menu,
 * details from the name. Busy and error state live here so the menu and the status cell agree.
 */
export function ReleaseRow({ release, target }: { release: Release; target: { isPaused: boolean } | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "approve" | "confirm">("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<"withdraw" | "delete" | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const status = releaseStatus(release);
  const label = `${release.display_name} ${release.version}`;

  async function run(kind: "approve" | "confirm", action: () => Promise<Result>) {
    setBusy(kind);
    setError("");
    const result = await action();
    setBusy("");
    setConfirming(null);
    if ("error" in result) setError(result.error);
    else router.refresh();
  }

  const badges = (
    <>
      <Badge variant={BADGE[status]}>{STATUS_LABELS[status]}</Badge>
      {target && <Badge variant={target.isPaused ? "warning" : "info"}>{target.isPaused ? "In test group · paused" : "In test group"}</Badge>}
    </>
  );

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <ReleaseDetails release={release} badges={badges} />
      </td>
      <td className="p-3">{release.version}</td>
      <td className="p-3">{megabytes(release.files.reduce((sum, file) => sum + file.size, 0))}</td>
      <td className="p-3">{formatTime(release.created_at)}</td>
      <td className="p-3">
        <div className="grid justify-items-start gap-1">
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
          {busy === "approve" && <p role="status" className="text-sm text-muted-foreground">Checking files…</p>}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
        </div>
      </td>
      <td className="p-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={`Actions for ${label}`} disabled={busy !== ""}>
              <MoreIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {status === "not_approved" && (
              <DropdownMenuItem onSelect={() => void run("approve", () => admitPlayerRelease(release.id))}>Approve</DropdownMenuItem>
            )}
            {status === "approved" && release.admitted && (
              <DropdownMenuItem asChild>
                <Link href={`/media-workspace/player-releases/pilot?release=${release.admitted.id}`}>Send to test group</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setIsRenaming(true)}>Rename</DropdownMenuItem>
            {status !== "withdrawn" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-error focus:text-error" onSelect={() => setConfirming(status === "approved" ? "withdraw" : "delete")}>
                  {status === "approved" ? "Withdraw" : "Delete"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ReleaseRenameDialog release={release} isOpen={isRenaming} onOpenChange={setIsRenaming} />
        <AlertDialog open={confirming !== null} onOpenChange={(next) => { if (busy === "" && !next) setConfirming(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirming === "delete" ? "Delete" : "Withdraw"} {label}?</AlertDialogTitle>
              <AlertDialogDescription>{confirming ? CONFIRM[confirming] : ""}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy !== ""}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy !== ""}
                onClick={(event) => {
                  event.preventDefault();
                  if (confirming === "delete") void run("confirm", () => deletePlayerRelease(release.id));
                  else if (release.admitted) {
                    const admittedId = release.admitted.id;
                    void run("confirm", () => revokePlayerRelease(admittedId));
                  }
                }}
                className="bg-error hover:bg-error"
              >
                {busy === "confirm" ? (confirming === "delete" ? "Deleting…" : "Withdrawing…") : confirming === "delete" ? "Delete" : "Withdraw"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}
