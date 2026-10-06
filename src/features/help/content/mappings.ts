// Context, relationship and Use Case mappings for the Media pilot (Help Spec §2).
// Screen keys come from ../screens.ts. A mapping to a non-public Guide is harmless: delivery
// filters by publication status, so it simply never shows (D-G6-01).

import type { ContextMapping, GuideRelationship, UseCaseMapping } from "../types";

export const CONTEXT_MAPPINGS: ContextMapping[] = [
  // Exact: the Playlist editor shows one playlist object.
  { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", guideId: "GDE-0002", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", guideId: "GDE-0003", relationshipType: "RELATED" },
  { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", guideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },

  // Screen level.
  { workspaceKey: "media", screenKey: "media.playlists", guideId: "GDE-0002", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.playlists", guideId: "GDE-0005", relationshipType: "RELATED" },
  { workspaceKey: "media", screenKey: "media.playlists", guideId: "GDE-0004", relationshipType: "RELATED" },
  { workspaceKey: "media", screenKey: "media.playlists", guideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },

  { workspaceKey: "media", screenKey: "media.assets", guideId: "GDE-0003", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.assets", guideId: "GDE-0002", relationshipType: "RELATED" },
  { workspaceKey: "media", screenKey: "media.assets.upload", guideId: "GDE-0003", relationshipType: "PRIMARY" },

  { workspaceKey: "media", screenKey: "media.programs", guideId: "GDE-0004", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.programs", guideId: "GDE-0005", relationshipType: "RELATED" },
  { workspaceKey: "media", screenKey: "media.programs", guideId: "GDE-0008", relationshipType: "TROUBLESHOOTING" },
  { workspaceKey: "media", screenKey: "media.program-create", guideId: "GDE-0004", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.program-create", guideId: "GDE-0008", relationshipType: "TROUBLESHOOTING" },

  { workspaceKey: "media", screenKey: "media.now-next", guideId: "GDE-0007", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.now-next", guideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },

  { workspaceKey: "media", screenKey: "media.channels", guideId: "GDE-0006", relationshipType: "PRIMARY" },
  { workspaceKey: "media", screenKey: "media.channels", guideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },
  { workspaceKey: "media", screenKey: "media.channel-groups", guideId: "GDE-0011", relationshipType: "PRIMARY" },

  // Workspace level: any Media screen without its own mapping.
  { workspaceKey: "media", guideId: "GDE-0001", relationshipType: "PRIMARY" },
  { workspaceKey: "media", guideId: "GDE-0005", relationshipType: "RELATED" },
  { workspaceKey: "media", guideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },

  // General Help: the last fallback, and the answer for routes outside the pilot.
  { workspaceKey: "general", guideId: "GDE-0010", relationshipType: "PRIMARY" },
];

export const GUIDE_RELATIONSHIPS: GuideRelationship[] = [
  { sourceGuideId: "GDE-0001", targetGuideId: "GDE-0002", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0001", targetGuideId: "GDE-0004", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0002", targetGuideId: "GDE-0004", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0002", targetGuideId: "GDE-0005", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0002", targetGuideId: "GDE-0012", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0002", targetGuideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },
  { sourceGuideId: "GDE-0003", targetGuideId: "GDE-0002", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0003", targetGuideId: "GDE-0008", relationshipType: "TROUBLESHOOTING" },
  { sourceGuideId: "GDE-0004", targetGuideId: "GDE-0005", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0004", targetGuideId: "GDE-0007", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0004", targetGuideId: "GDE-0011", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0004", targetGuideId: "GDE-0008", relationshipType: "TROUBLESHOOTING" },
  { sourceGuideId: "GDE-0006", targetGuideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },
  { sourceGuideId: "GDE-0007", targetGuideId: "GDE-0006", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0007", targetGuideId: "GDE-0009", relationshipType: "TROUBLESHOOTING" },
  { sourceGuideId: "GDE-0008", targetGuideId: "GDE-0004", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0009", targetGuideId: "GDE-0006", relationshipType: "RELATED" },
  { sourceGuideId: "GDE-0009", targetGuideId: "GDE-0007", relationshipType: "RELATED" },
];

/**
 * Use Case → Guide traceability. Left empty on purpose: this repo has no canonical Media Workspace
 * UC IDs to point at, and inventing IDs would fake the traceability the spec asks for. The Media PO
 * supplies them; the shape is ready.
 */
export const USE_CASE_MAPPINGS: UseCaseMapping[] = [];

/** Guides offered on the Help Center Home. A content decision, not ranking. */
export const RECOMMENDED_GUIDE_IDS = ["GDE-0002", "GDE-0003", "GDE-0004", "GDE-0008"];
