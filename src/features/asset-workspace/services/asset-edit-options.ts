import type { AssetDetail } from "./asset-profile-contract";
import type { ProfileReadResult } from "./asset-profile-api";
import type { RegistrationOptions } from "./asset-registration-contract";
import type { AssetCategoryDetail } from "../domain/asset-category";

export type AssetEditOptions = { rules: RegistrationOptions; currentCategory: AssetCategoryDetail | null };

export async function getAssetEditOptions(context: string, asset: AssetDetail, signal: AbortSignal): Promise<ProfileReadResult<AssetEditOptions>> {
  const [{ refreshRegistrationOptions, RegistrationRequestError }, { getCategory }] = await Promise.all([
    import("./asset-registration-client"), import("./asset-categories-api"),
  ]);
  try {
    const [rules, category] = await Promise.all([
      refreshRegistrationOptions(context, signal), asset.category ? getCategory(context, asset.category.id, signal) : null,
    ]);
    return { ok: true, data: { rules, currentCategory: category?.ok ? category.data : null } };
  } catch (error) {
    if (signal.aborted) throw error;
    const code = error instanceof RegistrationRequestError ? error.code : "UNREACHABLE";
    const message = code === "PERMISSION_DENIED" ? "You don't have permission to edit assets."
      : code === "UNAUTHENTICATED" ? "Your session has expired. Sign in again before editing."
        : "Category options could not be loaded. Retry to continue.";
    return { ok: false, status: 503, code, message };
  }
}
