// Pure, Node-loadable Channel domain boundary. Runnable checks import this file so
// the public feature barrel can also expose client components without loading TSX.
export * from "./channel-logic.ts";
export type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDeviceCandidate,
  ChannelDisplayConfig,
  ChannelDisplayConfigScreen,
  ChannelDraftInput,
  ChannelFilters,
  ChannelGroupSummary,
  ChannelHealth,
  ChannelListItem,
  ChannelLifecycle,
  ChannelOrientation,
  ChannelOutputKind,
  ChannelStatusFilter,
  ChannelTypeFilter,
  ChannelTypeOption,
} from "./types/index.ts";
