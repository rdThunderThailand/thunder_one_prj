import type { PublicationDeliveryTarget } from "../types";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return "—";
  const exact = `${bytes.toLocaleString()} B`;
  if (bytes < 1024) return exact;
  if (bytes < 1024 * 1024) return `${exact} (${(bytes / 1024).toFixed(1)} KB)`;
  return `${exact} (${(bytes / (1024 * 1024)).toFixed(1)} MB)`;
}

/** Expanded row: the operator summary first, the per-file evidence support needs folded below. */
export function DeliveryDeviceDetail({ target }: { target: PublicationDeliveryTarget }) {
  const files = Object.entries(target.file_statuses ?? {});

  return (
    <div className="flex flex-col gap-3 text-xs text-muted-foreground">
      {target.error_message && (
        <p className="text-error">
          <span className="font-medium">สาเหตุ:</span> {target.error_message}
        </p>
      )}
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <dt>Heartbeat ล่าสุด</dt>
          <dd className="text-foreground">{formatDate(target.last_heartbeat_at)}</dd>
        </div>
        <div>
          <dt>Retry แล้ว</dt>
          <dd className="text-foreground">{target.retry_count ?? 0} ครั้ง</dd>
        </div>
        <div>
          <dt>Retry ล่าสุด</dt>
          <dd className="text-foreground">{formatDate(target.last_retried_at)}</dd>
        </div>
      </dl>
      {files.length > 0 && (
        <details>
          <summary className="cursor-pointer font-medium text-foreground">
            รายละเอียดไฟล์ ({files.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {files.map(([assetId, entry]) => (
              <li
                key={assetId}
                className="rounded border border-border bg-card p-2"
              >
                <div className="font-medium text-foreground">{entry.file_name ?? "—"}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Asset: {assetId}</span>
                  <span>สถานะ: {entry.status}</span>
                  <span>ขนาดบนดิสก์: {formatBytes(entry.file_size)}</span>
                  {entry.downloaded !== undefined && (
                    <span>{entry.downloaded ? "ดาวน์โหลดรอบนี้" : "ใช้ไฟล์เดิมในเครื่อง"}</span>
                  )}
                  {entry.verified !== undefined && (
                    <span>
                      ตรวจ checksum:{" "}
                      {entry.checksum == null ? "ไม่มีข้อมูล" : entry.verified ? "ผ่าน" : "ไม่ผ่าน"}
                    </span>
                  )}
                  <span>เครื่องรายงาน: {formatDate(entry.reported_at)}</span>
                  <span>Server รับ: {formatDate(entry.acked_at)}</span>
                </div>
                {entry.checksum && <div className="mt-1 break-all">Checksum: {entry.checksum}</div>}
                {entry.error && <div className="mt-1 text-error">{entry.error}</div>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
