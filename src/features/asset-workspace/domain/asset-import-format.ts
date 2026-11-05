const countFormatter = new Intl.NumberFormat("en-GB");
const byteFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const bangkokDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${byteFormatter.format(kb)} KB`;
  const mb = kb / 1024;
  return `${byteFormatter.format(mb)} MB`;
}

export function formatCount(count: number): string {
  if (!Number.isFinite(count)) return "0";
  return countFormatter.format(count);
}

export function formatBangkokDateTime(iso: string): string {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return "–";
  return bangkokDateTimeFormatter.format(new Date(timestamp));
}
