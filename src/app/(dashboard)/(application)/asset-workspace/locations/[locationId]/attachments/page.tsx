import { ClockIcon, FileIcon, FolderIcon } from "@/components/ui/icons";
import { LocationAttachmentsSection, UploadLocationFileButton } from "@/features/asset-workspace/components/locations/LocationDetailSections";
import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { KpiGrid } from "@/features/asset-workspace/components/reports/ReportWidgets";
import { formatBytes } from "@/features/asset-workspace/domain/asset-import-format";
import { getSession } from "@/features/auth/services/get-session";
import { getLocationAttachments } from "@/features/asset-workspace/services/asset-locations-api";
import type { SearchParams } from "@/features/asset-workspace/services/asset-reports-api";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

// Location Attachments (05 §4.8, Core #344): files linked to this location. Upload uses the Asset Profile's document
// upload; Unlink keeps the file in Shared Files. No file category / Related To (beyond PO).
export default async function LocationAttachmentsTab({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locationId }, sp, session] = await Promise.all([params, searchParams, getSession()]);
  // Table follows the URL; the KPIs read the newest 100 without the search.
  // ponytail: Storage Used sums the newest 100 files only; move to a Core total if a location passes that.
  const [files, all] = await Promise.all([
    getLocationAttachments(locationId, sp),
    getLocationAttachments(locationId, { pageSize: "100" }),
  ]);
  const known = all.data && !all.unavailable;
  const rows = all.data?.rows ?? [];
  const context = session !== "forbidden" && session.tenantId && session.userId ? `${session.tenantId}:${session.userId}` : null;

  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="Attachments"
        count={known ? all.data!.total : null}
        subtitle="Files and documents related to this location."
        action={
          context && (
            <UploadLocationFileButton
              locationId={locationId}
              context={context}
            />
          )
        }
      />
      <KpiGrid
        tiles={[
          { label: "Total Files", value: known ? all.data!.total : null, hint: "Files at this location", icon: <FileIcon className="h-4 w-4" />, tone: "blue" },
          {
            label: "Storage Used",
            value: known ? formatBytes(rows.reduce((sum, f) => sum + (f.size ?? 0), 0)) : null,
            hint: "Total file size",
            icon: <FolderIcon className="h-4 w-4" />,
            tone: "green",
          },
          {
            label: "Recently Updated",
            value: known ? (rows[0] ? dateFmt.format(new Date(rows[0].updatedAt)) : "—") : null,
            hint: "Latest file update",
            icon: <ClockIcon className="h-4 w-4" />,
          },
        ]}
      />
      <LocationAttachmentsSection
        locationId={locationId}
        data={files.data}
        unavailable={files.unavailable}
      />
    </div>
  );
}
