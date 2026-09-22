// Pure, Node-loadable Channel domain boundary. Runnable checks import this file so
// the public feature barrel can also expose client components without loading TSX.
export * from "./channel-logic.ts";
export type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDisplayArrangement,
  ChannelDisplayConfig,
  ChannelDisplayConfigScreen,
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
