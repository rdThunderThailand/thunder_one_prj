// Route → HelpContext registry. This is the single, standard way a Workspace supplies its
// HelpContext (D-G7-02): the shell reads the current pathname here; no Workspace wires Help itself.
// Only the Media pilot has screens today; every other route resolves to General Help.

import type { HelpContext, Locale, WorkspaceKey } from "./types";

export interface HelpScreen {
  workspaceKey: WorkspaceKey;
  screenKey: string;
  /** Set on screens that show one object, so an Exact mapping can target it. */
  objectType?: string;
  /** As the Workspace UI names the screen. Media's nav is English in both locales, so both entries match it. */
  label: Record<Locale, string>;
  /**
   * Where "Back to ThunderOne" lands when the exact originating path is no longer known.
   * Always a list route: object ids never leave the session (D-G8-01).
   */
  route: string;
  match: RegExp;
}

const ID = "[^/]+";

// Order matters: the first match wins, so more specific routes come first.
export const HELP_SCREENS: HelpScreen[] = [
  { workspaceKey: "media", screenKey: "media.assets.upload", label: { th: "Upload Media", en: "Upload Media" }, route: "/media-workspace/assets/upload", match: /^\/media-workspace\/assets\/upload\/?$/ },
  { workspaceKey: "media", screenKey: "media.asset-detail", objectType: "asset", label: { th: "Media Detail", en: "Media Detail" }, route: "/media-workspace/assets", match: new RegExp(`^/media-workspace/assets/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.assets", label: { th: "Media Library", en: "Media Library" }, route: "/media-workspace/assets", match: /^\/media-workspace\/assets\/?$/ },
  { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", label: { th: "Playlist Editor", en: "Playlist Editor" }, route: "/media-workspace/playlists", match: new RegExp(`^/media-workspace/playlists/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.playlists", label: { th: "Playlists", en: "Playlists" }, route: "/media-workspace/playlists", match: /^\/media-workspace\/playlists\/?$/ },
  { workspaceKey: "media", screenKey: "media.templates", label: { th: "Templates", en: "Templates" }, route: "/media-workspace/layouts/templates", match: /^\/media-workspace\/layouts\/templates(\/.*)?$/ },
  { workspaceKey: "media", screenKey: "media.layout-editor", objectType: "layout", label: { th: "Layout Editor", en: "Layout Editor" }, route: "/media-workspace/layouts", match: new RegExp(`^/media-workspace/(layouts|compositions)/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.layouts", label: { th: "Layouts", en: "Layouts" }, route: "/media-workspace/layouts", match: /^\/media-workspace\/(layouts|compositions)\/?$/ },
  { workspaceKey: "media", screenKey: "media.program-create", label: { th: "Create Program", en: "Create Program" }, route: "/media-workspace/program/create", match: /^\/media-workspace\/program\/create\/?$/ },
  { workspaceKey: "media", screenKey: "media.program-detail", objectType: "program", label: { th: "Program Detail", en: "Program Detail" }, route: "/media-workspace/program", match: new RegExp(`^/media-workspace/program/${ID}(/edit)?/?$`) },
  { workspaceKey: "media", screenKey: "media.programs", label: { th: "Programs", en: "Programs" }, route: "/media-workspace/program", match: /^\/media-workspace\/program\/?$/ },
  { workspaceKey: "media", screenKey: "media.now-next", label: { th: "Now & Next", en: "Now & Next" }, route: "/media-workspace/now-next", match: /^\/media-workspace\/now-next\/?$/ },
  { workspaceKey: "media", screenKey: "media.channel-edit", objectType: "channel", label: { th: "Edit Channel", en: "Edit Channel" }, route: "/media-workspace/channels", match: new RegExp(`^/media-workspace/channels/${ID}(/edit)?/?$`) },
  { workspaceKey: "media", screenKey: "media.channels", label: { th: "All Channels", en: "All Channels" }, route: "/media-workspace/channels", match: /^\/media-workspace\/channels\/?$/ },
  { workspaceKey: "media", screenKey: "media.channel-groups", label: { th: "Channel Groups", en: "Channel Groups" }, route: "/media-workspace/channel-groups", match: /^\/media-workspace\/channel-groups\/?$/ },
  { workspaceKey: "media", screenKey: "media.overview", label: { th: "Overview", en: "Overview" }, route: "/media-workspace", match: /^\/media-workspace\/?$/ },
];

export function findScreen(pathname: string): HelpScreen | null {
  return HELP_SCREENS.find((s) => s.match.test(pathname)) ?? null;
}

export function findScreenByKey(screenKey: string | undefined): HelpScreen | null {
  if (!screenKey) return null;
  return HELP_SCREENS.find((s) => s.screenKey === screenKey) ?? null;
}

/** Builds the standard HelpContext for the current route. Routes outside the pilot resolve to General Help. */
export function helpContextFromPathname(pathname: string, locale: Locale): HelpContext {
  const screen = findScreen(pathname);
  if (!screen) {
    const inMedia = pathname === "/media-workspace" || pathname.startsWith("/media-workspace/");
    return { workspaceKey: inMedia ? "media" : "general", locale, returnContext: pathname };
  }
  return {
    workspaceKey: screen.workspaceKey,
    screenKey: screen.screenKey,
    objectType: screen.objectType,
    locale,
    returnContext: pathname,
  };
}
