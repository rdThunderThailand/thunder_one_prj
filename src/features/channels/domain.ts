// Pure, Node-loadable Channel domain boundary. Runnable checks import this file so
// the public feature barrel can also expose client components without loading TSX.
export * from "./channel-logic.ts";
export type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDeviceCandidate,
  ChannelDraftInput,
  ChannelFilters,
  ChannelHealth,
  ChannelListItem,
  ChannelLifecycle,
  ChannelOrientation,
  ChannelTypeOption,
} from "./types/index.ts";
