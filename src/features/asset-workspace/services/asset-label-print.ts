/** Open only an already-generated local PDF, directly from the user's Print click. */
export function printAssetLabelsPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const viewer = window.open(url, "_blank");
  if (!viewer) { URL.revokeObjectURL(url); throw new Error("The PDF viewer was blocked"); }
  viewer.opener = null;
  viewer.addEventListener("load", () => {
    try { viewer.focus(); viewer.print(); }
    catch { /* Native PDF viewers also provide their own Print control. */ }
  }, { once: true });
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
