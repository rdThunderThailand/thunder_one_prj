const countFormatter = new Intl.NumberFormat("en-GB");
const byteFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
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
