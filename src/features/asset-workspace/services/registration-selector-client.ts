import { requestAssetWorkspace } from "./asset-workspace-api";
import { selectorPageSchema, selectorQuerySchema, type SelectorPage, type SelectorQuery } from "./registration-selector-contract";

const paths = { categories: "categories", locations: "locations", orgUnits: "org-units", persons: "persons" };
export async function fetchRegistrationReferences(context: string, input: SelectorQuery, signal?: AbortSignal): Promise<SelectorPage> {
  const { kind, ...query } = selectorQuerySchema.parse(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value));
  const data = await requestAssetWorkspace("GET", `/registration-options/${paths[kind]}?${params}`, undefined, { context, signal, timeout: 20000 });
  const parsed = selectorPageSchema(kind).safeParse(data);
  if (!parsed.success) throw new Error("The reference service returned an unexpected response. Try again.");
  return parsed.data;
}
