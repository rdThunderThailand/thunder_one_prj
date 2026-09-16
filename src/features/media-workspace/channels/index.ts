// Public API for the "channels" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export * from "./domain.ts";
export { ChannelEditorPage } from "./components/ChannelEditorPage";
export { ChannelsListPage } from "./components/ChannelsListPage";
export { fetchChannels } from "./services/channels-api";
export type { ChannelListItem } from "./types";
