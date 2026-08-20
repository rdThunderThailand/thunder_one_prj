// Public API for the "channels" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export * from "./channel-logic.ts";
export type {
  ChannelCategory,
  ChannelDetail,
  ChannelDevice,
  ChannelDraftInput,
  ChannelFilters,
  ChannelHealth,
  ChannelLifecycle,
  ChannelOrientation,
  ChannelTypeOption,
} from "./types/index.ts";
