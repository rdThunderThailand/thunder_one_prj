import { z } from "zod";
import { referenceItemSchema, type SelectorPage } from "./registration-selector-contract.ts";

export type RegistrationCategoryRequester = (context: string, id: string, signal: AbortSignal) => Promise<SelectorPage>;
const request: RegistrationCategoryRequester = async (context, id, signal) => {
  const { fetchRegistrationReferences } = await import("./registration-selector-client");
  return fetchRegistrationReferences(context, { kind: "categories", id }, signal);
};

function failure(status: number) {
  const message = status === 400 ? "The category link is invalid. Continue to registration and choose a category."
    : status === 401 ? "Your session expired. Sign in again; your saved registration has been kept."
      : status === 403 ? "You don't have access to register with this category in the current organization. Your saved registration has been kept."
        : status === 404 ? "This category is inactive or no longer available in the current organization. Choose another category to register an asset."
          : "The category could not be verified. Retry or continue without category preselection. Your saved registration has been kept.";
  return { ok: false as const, status, message };
}

export async function loadRegistrationCategory(context: string, input: string | string[], signal: AbortSignal,
  requester: RegistrationCategoryRequester = request) {
  const parsedId = z.guid().transform((id) => id.toLowerCase()).safeParse(input);
  if (!parsedId.success) return failure(400);
  try {
    signal.throwIfAborted();
    const page = await requester(context, parsedId.data, signal);
    signal.throwIfAborted();
    const row = page.items.find((item) => item.id === parsedId.data);
    if (!row) return failure(404);
    const parsed = referenceItemSchema.safeParse(row);
    if (!parsed.success || typeof parsed.data.is_serial_required !== "boolean") return failure(502);
    return { ok: true as const, category: parsed.data };
  } catch (error) {
    if (signal.aborted) throw error;
    const status = typeof error === "object" && error && "status" in error && typeof error.status === "number" ? error.status : 503;
    return failure(status);
  }
}
