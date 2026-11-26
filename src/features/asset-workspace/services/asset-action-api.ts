/** Shared JSON transport seam for the read-only label and history actions. */
export type AssetActionRequester = (method: "GET" | "POST", path: string, data: unknown,
  options: { context: string; signal: AbortSignal }) => Promise<unknown>;

export const requestAssetAction: AssetActionRequester = async (...args) => {
  const { requestAssetWorkspace } = await import("./asset-workspace-api");
  return requestAssetWorkspace(...args);
};
