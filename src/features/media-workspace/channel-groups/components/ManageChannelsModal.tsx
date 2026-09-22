"use client";

import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import { isSyncConflict, setChannelGroupMembers } from "../services/channel-groups-api";
import type { ChannelListItem } from "../../channels/types";
import type { ChannelGroup } from "../types";
import { CreateGroupChannelsModal } from "./CreateGroupChannelsModal";

/** Uses the same chooser as Group creation; only persistence differs. */
export function ManageChannelsModal({
  group,
  channels,
  onClose,
  onSaved,
}: {
  group: ChannelGroup;
  channels: ChannelListItem[];
  onClose: () => void;
  onSaved: (group: ChannelGroup) => void;
}) {
  const save = async (selected: Set<string>): Promise<string | void> => {
    try {
      onSaved(await setChannelGroupMembers(group.id, Array.from(selected)));
      onClose();
    } catch (caught) {
      if (caught instanceof Error && isSyncConflict(caught.message)) {
        return "A channel can only belong to one synchronized Group at a time. Remove it from the other Group first.";
      }
      if (caught instanceof Error && isDuplicateName(caught.message)) return caught.message;
      return classifyApiError(caught, "Could not update this Group's members. Try again.").message;
    }
  };

  return (
    <CreateGroupChannelsModal
      channels={channels}
      selectedIds={new Set(group.members.map((member) => member.id))}
      description={`Add or remove channels from ${group.name}.`}
      selectedTitle="Channels in This Group"
      selectedEmptyMessage="No channels are currently in this group."
      saveLabel="Save Changes"
      onClose={onClose}
      onSave={save}
    />
  );
}
