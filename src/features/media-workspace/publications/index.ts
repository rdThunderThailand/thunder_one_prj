// Public API for the "publications" feature.
export { CreatePublicationPage } from "./components/CreatePublicationPage";
export { PublicationsListPage } from "./components/PublicationsListPage";
export { PublicationDetailPage } from "./components/PublicationDetailPage";
export { DemoPublicationDetailPage } from "./components/DemoPublicationDetailPage";

// Read-side surface for other features — the Overview dashboard consumes these.
// Keep the list minimal: it is the only sanctioned way in from outside, and the
// rest of the feature stays free to change shape behind it.
export { fetchPublication, fetchPublications } from "./services/publications-api";
export { classifyPublicationAiring, formatScheduleStart } from "./schedule";
export type { AiringState } from "./schedule";
export type { PublicationDetail, PublicationListItem } from "./types";
