import type { ProbeVerdict } from "@/types/domain";

/** ADR 0070: the backend sends a code + the facts the probe read, not prose — rendering the
 *  sentence an operator can act on is the frontend's job. `null` means nothing to show: the
 *  happy path (`supported`, i.e. Baseline) and an Asset with no verdict at all (registered
 *  before ADR 0070, or an image) both render exactly as today. */
export function verdictMessage(verdict: ProbeVerdict | null | undefined): string | null {
  switch (verdict?.code) {
    case "unsupported_profile":
      return `This file is H.264 ${verdict.profile ?? "an unsupported"} Profile, which the players cannot decode — convert to Baseline and upload again.`;
    case "unreadable":
      return "This file's video codec could not be read — convert to H.264 Baseline and upload again.";
    case "unverified_preset":
      return `Admitted on ${verdict.profile ?? "an uncertified"} Profile, which has not been certified on all players yet.`;
    default:
      return null;
  }
}
