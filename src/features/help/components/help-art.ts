// Help Center artwork from the FigJam "Help Center — Home" frame (assets in public/help/).
// Presentation only: Guides stay image-free in the data, so a Guide without art falls back to its
// Content Type icon, and nothing here decides what is published.

import type { ContentType, Locale, WorkspaceKey } from "../types";

export const HERO_BG = "/help/hero-bg.png";
export const HERO_ILLUSTRATION = "/help/hero-illustration.png";
export const SUPPORT_ICON = "/help/support.png";

/**
 * The five Workspaces the design shows on Home, in its order. `key` is set only where Help has
 * content for that Workspace; the others show as "no guides yet" instead of linking to an empty list.
 */
export interface HomeWorkspace {
  id: string;
  key: WorkspaceKey | null;
  label: string;
  description: Record<Locale, string>;
  icon: string;
  art: string;
}

export const HOME_WORKSPACES: HomeWorkspace[] = [
  {
    id: "media",
    key: "media",
    label: "Media",
    description: { th: "จัดการสื่อและเพลย์ลิสต์", en: "Media & Playlists" },
    icon: "/help/workspace/media.png",
    art: "/help/workspace-art/media.png",
  },
  {
    id: "asset",
    key: null,
    label: "Asset",
    description: { th: "จัดการอุปกรณ์และสินทรัพย์", en: "Devices & assets" },
    icon: "/help/workspace/asset.png",
    art: "/help/workspace-art/asset.png",
  },
  {
    id: "people",
    key: null,
    label: "People",
    description: { th: "จัดการบุคลากรและสิทธิ์", en: "People & access" },
    icon: "/help/workspace/people.png",
    art: "/help/workspace-art/people.png",
  },
  {
    id: "customer",
    key: null,
    label: "Customer",
    description: { th: "จัดการลูกค้าและการบริการ", en: "Customers & service" },
    icon: "/help/workspace/customer.png",
    art: "/help/workspace-art/customer.png",
  },
  {
    id: "communication",
    key: null,
    label: "Communication",
    description: { th: "สื่อสารและแคมเปญ", en: "Messaging" },
    icon: "/help/workspace/communication.png",
    art: "/help/workspace-art/communication.png",
  },
];

/** Coloured Content Type tiles for Home (design). Lists elsewhere keep the neutral ContentTypeIcon. */
export const CONTENT_TYPE_ART: Record<ContentType, string> = {
  "getting-started": "/help/type/getting-started.png",
  "how-to": "/help/type/how-to.png",
  concept: "/help/type/concept.png",
  troubleshooting: "/help/type/troubleshooting.png",
  reference: "/help/type/reference.png",
};

/** Card thumbnails for Guides the design draws one for. */
const GUIDE_ART: Record<string, string> = {
  "GDE-0002": "/help/guides/create-playlist.png",
  "GDE-0003": "/help/workspace-art/media.png",
  "GDE-0004": "/help/guides/publish-content.png",
  "GDE-0006": "/help/guides/playback.png",
};

export function guideArt(guideId: string): string | null {
  return GUIDE_ART[guideId] ?? null;
}
