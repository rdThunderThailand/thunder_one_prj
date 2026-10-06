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
  /** "About this page" in the Help panel: what the screen is for, from the screen's own subtitle. */
  about: Record<Locale, string>;
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
  { workspaceKey: "media", screenKey: "media.assets.upload", label: { th: "Upload Media", en: "Upload Media" }, about: { th: "อัปโหลดรูปภาพและวิดีโอเข้า Media Library และติดตามความคืบหน้าใน Upload Queue", en: "Upload images and videos to the Media Library and follow them in the Upload Queue." }, route: "/media-workspace/assets/upload", match: /^\/media-workspace\/assets\/upload\/?$/ },
  { workspaceKey: "media", screenKey: "media.asset-detail", objectType: "asset", label: { th: "Media Detail", en: "Media Detail" }, about: { th: "ดูและจัดการสื่อหนึ่งรายการ", en: "Inspect and manage a single media asset." }, route: "/media-workspace/assets", match: new RegExp(`^/media-workspace/assets/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.assets", label: { th: "Media Library", en: "Media Library" }, about: { th: "จัดการและจัดระเบียบสื่อทั้งหมดของคุณ", en: "Manage and organize all your media assets." }, route: "/media-workspace/assets", match: /^\/media-workspace\/assets\/?$/ },
  { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", label: { th: "Playlist Editor", en: "Playlist Editor" }, about: { th: "เพิ่มสื่อ จัดลำดับ และตั้งค่าการเล่นของ Playlist นี้", en: "Add media, set the order and choose how this Playlist plays." }, route: "/media-workspace/playlists", match: new RegExp(`^/media-workspace/playlists/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.playlists", label: { th: "Playlists", en: "Playlists" }, about: { th: "สร้างและจัดการ Playlist สำหรับแคมเปญและช่องของคุณ", en: "Create and manage playlists for your campaigns and channels." }, route: "/media-workspace/playlists", match: /^\/media-workspace\/playlists\/?$/ },
  { workspaceKey: "media", screenKey: "media.templates", label: { th: "Templates", en: "Templates" }, about: { th: "สร้างและจัดการรูปแบบ Zone ที่ใช้ซ้ำได้สำหรับ Layout", en: "Create and manage reusable Zone geometry for Layouts." }, route: "/media-workspace/layouts/templates", match: /^\/media-workspace\/layouts\/templates(\/.*)?$/ },
  { workspaceKey: "media", screenKey: "media.layout-editor", objectType: "layout", label: { th: "Layout Editor", en: "Layout Editor" }, about: { th: "วาด Zone และใส่เนื้อหาให้แต่ละ Zone ของ Layout นี้", en: "Draw Zones and put content in each Zone of this Layout." }, route: "/media-workspace/layouts", match: new RegExp(`^/media-workspace/(layouts|compositions)/${ID}/?$`) },
  { workspaceKey: "media", screenKey: "media.layouts", label: { th: "Layouts", en: "Layouts" }, about: { th: "สร้าง จัดระเบียบ และจัดการ Layout ของจอแสดงผล", en: "Create, organize, and manage screen layouts for your displays." }, route: "/media-workspace/layouts", match: /^\/media-workspace\/(layouts|compositions)\/?$/ },
  { workspaceKey: "media", screenKey: "media.program-create", label: { th: "Create Program", en: "Create Program" }, about: { th: "เลือกเนื้อหา ช่อง และเวลา แล้วเผยแพร่เป็น Program", en: "Pick content, Channels and a schedule, then publish it as a Program." }, route: "/media-workspace/program/create", match: /^\/media-workspace\/program\/create\/?$/ },
  { workspaceKey: "media", screenKey: "media.program-detail", objectType: "program", label: { th: "Program Detail", en: "Program Detail" }, about: { th: "ดูรายละเอียดและสถานะการส่งของ Program นี้", en: "See this Program's details and delivery." }, route: "/media-workspace/program", match: new RegExp(`^/media-workspace/program/${ID}(/edit)?/?$`) },
  { workspaceKey: "media", screenKey: "media.programs", label: { th: "Programs", en: "Programs" }, about: { th: "จัดการโปรแกรมที่ออกอากาศบนช่องของคุณ", en: "Manage the Programs that air on your Channels." }, route: "/media-workspace/program", match: /^\/media-workspace\/program\/?$/ },
  { workspaceKey: "media", screenKey: "media.now-next", label: { th: "Now & Next", en: "Now & Next" }, about: { th: "ดูว่าตอนนี้และถัดไปมีอะไรเล่นบนแต่ละช่อง", en: "See what is scheduled now and coming up on your Channels." }, route: "/media-workspace/now-next", match: /^\/media-workspace\/now-next\/?$/ },
  { workspaceKey: "media", screenKey: "media.channel-edit", objectType: "channel", label: { th: "Edit Channel", en: "Edit Channel" }, about: { th: "แก้ไขข้อมูลช่องและการตั้งค่าจอ", en: "Update channel information and screen configuration." }, route: "/media-workspace/channels", match: new RegExp(`^/media-workspace/channels/${ID}(/edit)?/?$`) },
  { workspaceKey: "media", screenKey: "media.channels", label: { th: "All Channels", en: "All Channels" }, about: { th: "จัดการและติดตามช่องทั้งหมด แยกตามประเภท สถานที่ และการใช้งาน", en: "Manage and monitor all your channels, grouped by type, location, and purpose." }, route: "/media-workspace/channels", match: /^\/media-workspace\/channels\/?$/ },
  { workspaceKey: "media", screenKey: "media.channel-groups", label: { th: "Channel Groups", en: "Channel Groups" }, about: { th: "จัดช่องเป็นกลุ่มเพื่อจัดการง่ายขึ้นและเล่นเนื้อหาให้ตรงกัน", en: "Organize channels into groups for easier management and synchronized content." }, route: "/media-workspace/channel-groups", match: /^\/media-workspace\/channel-groups\/?$/ },
  { workspaceKey: "media", screenKey: "media.overview", label: { th: "Overview", en: "Overview" }, about: { th: "ดูสถานะปัจจุบันของ Media Workspace แบบเรียลไทม์ รวมถึงการเล่นตอนนี้ โปรแกรมถัดไป ช่องที่มีปัญหา และกิจกรรมล่าสุด", en: "Real-time status of your media ecosystem: what's playing now, what's next, channels that need attention and recent activity." }, route: "/media-workspace", match: /^\/media-workspace\/?$/ },
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
