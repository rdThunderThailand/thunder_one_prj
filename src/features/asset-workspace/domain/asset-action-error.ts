import { z } from "zod";

export class AssetActionError extends Error {
  readonly status: number;
  readonly code: string;
  readonly assetNames: string[];

  constructor(message: string, status = 0, code = "REQUEST_FAILED", assetNames: string[] = []) {
    super(message);
    this.name = "AssetActionError";
    this.status = status;
    this.code = code;
    this.assetNames = assetNames;
  }
}

const failureSchema = z.object({
  status: z.number().default(0), code: z.string().default("REQUEST_FAILED"),
  details: z.unknown().optional(), serverMessage: z.string().optional(),
});

export function readActionFailure(error: unknown) {
  const parsed = failureSchema.safeParse(error);
  return parsed.success ? parsed.data : { status: 0, code: "REQUEST_FAILED", details: undefined, serverMessage: undefined };
}
