// The registration form's first data, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and the form shows when they are ready.
import { assetServerReader } from "./asset-server-read";
import { registrationOptionsSchema, type RegistrationOptions } from "./asset-registration-contract";
import type { SectionSeed } from "./assets-list-seed";
import { loadRegistrationCategory } from "./registration-category-prefill";
import { selectorPageSchema, type ReferenceItem, type SelectorPage } from "./registration-selector-contract";

export interface RegistrationFirstData {
  options: SectionSeed<RegistrationOptions>;
  /** Only for a category link. */
  category?: SectionSeed<ReferenceItem>;
}

export async function startRegistrationFirstData(token: string, tenantId: string, userId: string, categoryId?: string | string[]): Promise<RegistrationFirstData> {
  const read = await assetServerReader(token, tenantId);
  const key = `${tenantId}:${userId}`;
  const at = Date.now();
  const options = { key, at, data: read("/registration-options", registrationOptionsSchema) };
  if (categoryId === undefined) return { options };
  const category = loadRegistrationCategory(key, categoryId, new AbortController().signal, async (_context, id) => {
    const page = await read<SelectorPage>(`/registration-options/categories?id=${id}`, selectorPageSchema("categories"));
    if (!page) throw new Error("The category could not be read on the server.");
    return page;
  }).then((result) => result.ok ? result.category : null);
  return { options, category: { key, at, data: category } };
}
