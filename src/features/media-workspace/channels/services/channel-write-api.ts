import { parseChannelDetail } from "./channels-api.ts";
import type { CreateChannelPayload, UpdateChannelPayload } from "../create-wizard-state.ts";
import type { ChannelDetail } from "../types/index.ts";

/** Core v2's `player_id`/`output_kind`/`display_config` create/update shape (tickets 08/09). The
 * legacy `device_ids`-based write path is gone; `channels-api.ts`'s parser still reads a
 * `devices[]`-only legacy *read* payload for backward compatibility, which is unrelated. */
export async function createChannelV2(payload: CreateChannelPayload): Promise<ChannelDetail> {
  const { requestApi } = await import("../../../../lib/api/media-api.ts");
  const body = {
    ...payload,
    confirm_mismatch: true,
    as_draft: false,
  };
  return parseChannelDetail(await requestApi<unknown>("POST", "/media/channels", body));
}

export async function updateChannelV2(channelId: string, payload: UpdateChannelPayload): Promise<ChannelDetail> {
  const { requestApi } = await import("../../../../lib/api/media-api.ts");
  const body = {
    ...payload,
    confirm_mismatch: true,
  };
  return parseChannelDetail(await requestApi<unknown>("PATCH", `/media/channels/${channelId}`, body));
}
