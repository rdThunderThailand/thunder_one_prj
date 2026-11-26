"use client";

// Client halves of the Location Detail Attachments and History tabs (05 §4.8): columns, filters, Upload File and
// row Unlink. The server pages fetch (URL filters) and pass the list data in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { UploadIcon } from "@/components/ui/icons";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { validateAssetFile, type ProfileUploadReceipt } from "../../domain/asset-files-edit";
import { formatBytes } from "../../domain/asset-import-format";
import { HISTORY_ACTIONS } from "../../domain/location";
import type { LocationAttachment, LocationHistoryRow } from "../../services/asset-locations-api";
import { attachLocationFileAction, unlinkLocationAttachmentAction } from "../../services/asset-locations-actions";
import { uploadProfileFile } from "../../services/asset-profile-file-upload";
import { refreshRegistrationOptions } from "../../services/asset-registration-client";
import { AssetWorkspaceListPage, type ListColumn, type ListData } from "../list-page/AssetWorkspaceListPage";
import { ReportFilterBar } from "../reports/ReportFilterBar";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const fullFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", hour12: false, timeZone: "Asia/Bangkok" });
/** Date only in table columns (decided 2026-11-10); the time stays in the hover title. */
const DateCell = ({ iso }: { iso: string }) => (
  <time
    dateTime={iso}
    title={`${fullFmt.format(new Date(iso))} Asia/Bangkok`}
  >
    {dateFmt.format(new Date(iso))}
  </time>
);
const NOT_AVAILABLE = { emptyTitle: "Not available yet", emptyBody: "This list appears once its data service is ready." };

// ── Attachments ──

export function LocationAttachmentsSection({ locationId, data, unavailable }: {
  locationId: string; data: ListData<LocationAttachment> | null; unavailable: boolean;
}) {
  const columns: ListColumn<LocationAttachment>[] = [
    {
      key: "name",
      header: "File Name",
      render: (row) =>
        row.url ? (
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {row.fileName}
          </a>
        ) : (
          row.fileName
        ),
    },
    { key: "type", header: "Type", render: (row) => row.fileType ?? "—" },
    { key: "by", header: "Uploaded By", render: (row) => row.uploadedBy ?? "—" },
    { key: "updated", header: "Updated", render: (row) => <DateCell iso={row.updatedAt} />, className: "whitespace-nowrap" },
    { key: "size", header: "Size", render: (row) => (row.size === null ? "—" : formatBytes(row.size)), className: "text-right tabular-nums" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <UnlinkButton
          locationId={locationId}
          row={row}
        />
      ),
      className: "w-24 text-right",
    },
  ];

  return (
    <AssetWorkspaceListPage
      embedded
      title="Attachments"
      filters={(url) => (
        <ReportFilterBar
          url={url}
          searchPlaceholder="Search file name"
          selects={[]}
        />
      )}
      columns={columns}
      data={data}
      getRowId={(row) => row.linkId}
      itemLabel="files"
      {...(unavailable ? NOT_AVAILABLE : { emptyTitle: "No files", emptyBody: "Files uploaded to this location appear here." })}
    />
  );
}

function UnlinkButton({ locationId, row }: { locationId: string; row: LocationAttachment }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Unlink
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink {row.fileName}?</AlertDialogTitle>
          <AlertDialogDescription>It is removed from this location only. The file stays in Shared Files.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await unlinkLocationAttachmentAction(locationId, row.linkId);
                if (result.ok) {
                  toast.success("File unlinked");
                  setOpen(false);
                  router.refresh();
                } else toast.error(result.message);
              })
            }
          >
            {pending ? "Unlinking…" : "Unlink"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Upload File: the Asset Profile's document upload (reserve → PUT → complete, purpose asset_document), then link. */
export function UploadLocationFileButton({ locationId, context }: { locationId: string; context: string }) {
  const input = useRef<HTMLInputElement>(null);
  const receipts = useRef(new Map<string, ProfileUploadReceipt>());
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    try {
      setStatus("Checking file…");
      const options = await refreshRegistrationOptions(context);
      const error = validateAssetFile(file, "document", options.documentUpload?.enabled ? options.documentUpload.maxBytesPerDocument : 0);
      if (error) {
        toast.error(error);
        return;
      }
      const fileId = await uploadProfileFile(context, crypto.randomUUID(), file, "document", receipts.current,
        (progress) => setStatus(`${progress.stage}${progress.percent ? ` ${progress.percent}%` : ""}`), () => {});
      setStatus("Linking…");
      const result = await attachLocationFileAction(locationId, fileId);
      // The action's refresh() didn't re-render this list in testing; refresh from the client too.
      if (result.ok) {
        toast.success(`${file.name} uploaded`);
        router.refresh();
      }
      else toast.error(result.message);
    } catch {
      toast.error(`${file.name} could not be uploaded. Try again.`);
    } finally {
      setStatus(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        disabled={status !== null}
        onClick={() => input.current?.click()}
      >
        <UploadIcon className="h-4 w-4" />
        {status ?? "Upload File"}
      </Button>
    </>
  );
}

// ── History ──


function RelatedItem({ item }: { item: LocationHistoryRow["relatedItem"] }) {
  if (!item) return <>—</>;
  const href =
    item.type === "asset"
      ? `/asset-workspace/assets/${encodeURIComponent(item.id)}`
      : item.type === "location"
        ? `/asset-workspace/locations/${encodeURIComponent(item.id)}`
        : null;
  const label = item.assetTag ? `${item.name} (${item.assetTag})` : item.name;
  return href ? (
    <Link
      href={href}
      className="text-primary hover:underline"
    >
      {label}
    </Link>
  ) : (
    <>{label}</>
  );
}

const HISTORY_COLUMNS: ListColumn<LocationHistoryRow>[] = [
  { key: "at", header: "Date", render: (row) => <DateCell iso={row.at} />, className: "whitespace-nowrap" },
  {
    key: "action",
    header: "Event",
    render: (row) => (
      <Badge
        variant="pill"
        color="zinc"
        className="whitespace-nowrap"
      >
        {HISTORY_ACTIONS[row.action] ?? row.action}
      </Badge>
    ),
  },
  { key: "summary", header: "Details", render: (row) => row.summary },
  { key: "related", header: "Related Item", render: (row) => <RelatedItem item={row.relatedItem} /> },
  { key: "by", header: "By", render: (row) => row.actorName ?? "—" },
  { key: "reason", header: "Reason", render: (row) => row.reason ?? "—" },
];

export function LocationHistorySection({ data, unavailable }: { data: ListData<LocationHistoryRow> | null; unavailable: boolean }) {
  return (
    <AssetWorkspaceListPage
      embedded
      title="History"
      filters={(url) => (
        <ReportFilterBar
          url={url}
          selects={[
            { key: "action", label: "Event Type", options: Object.entries(HISTORY_ACTIONS).map(([value, label]) => ({ value, label })) },
          ]}
          dateRange={{ label: "Date", from: "from", to: "to" }}
        />
      )}
      columns={HISTORY_COLUMNS}
      data={data}
      getRowId={(row) => row.id}
      itemLabel="events"
      {...(unavailable ? NOT_AVAILABLE : { emptyTitle: "No events", emptyBody: "Changes and asset moves at this location appear here." })}
    />
  );
}
