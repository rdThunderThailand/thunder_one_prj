/* Copy of packages/thunderone-theme/src/workspaces/media.tsx, synced by scripts/build.mjs. Prefer: npm i @rdthunderthailand/thunderone-theme */
/**
 * Media Workspace extras (see skills/thunderone-ui/references/workspaces/media.md).
 *
 *   import { mediaStatus, MediaIcon, channelTypeIcon } from '@rdthunderthailand/thunderone-theme/workspaces/media';
 */
import {
  PictureOutlined, UnorderedListOutlined, LayoutOutlined, ProjectOutlined, PlayCircleOutlined, ApartmentOutlined,
  DesktopOutlined, FundProjectionScreenOutlined, SoundOutlined, TabletOutlined, EyeOutlined, BellOutlined,
  HeartOutlined, DisconnectOutlined, ExclamationCircleOutlined, SendOutlined, CloudUploadOutlined,
  PlusCircleOutlined, ScheduleOutlined, SunOutlined, WifiOutlined, CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { t1Status } from '../antd-theme';
import { T1Icon } from '../t1-icons';

/** Media channel/program states → semantic status. */
export const mediaStatus = {
  online: { label: 'Online', ...t1Status.success },
  live: { label: 'Live', ...t1Status.success },
  warning: { label: 'Warning', ...t1Status.warning },
  offline: { label: 'Offline', ...t1Status.error },
  scheduled: { label: 'Scheduled', ...t1Status.info },
  processing: { label: 'Processing', ...t1Status.inProgress },
} as const;
export type MediaStatus = keyof typeof mediaStatus;

/** Media concepts → icon. Platform concepts (search, help, create, edit…) come from T1Icon. */
export const MediaIcon = {
  // Navigation
  overview: T1Icon.overview,
  mediaLibrary: PictureOutlined,
  playlists: UnorderedListOutlined,
  layouts: LayoutOutlined,
  programs: ProjectOutlined,
  nowNext: PlayCircleOutlined,
  calendar: T1Icon.calendar,
  allChannels: ApartmentOutlined,
  liveView: EyeOutlined,
  alerts: BellOutlined,
  systemHealth: HeartOutlined,
  reports: T1Icon.reports,
  analytics: T1Icon.analytics,
  brandAssets: T1Icon.brandAssets,
  designSystem: T1Icon.designSystem,
  // Channel types
  screen: DesktopOutlined,
  tv: FundProjectionScreenOutlined,
  pa: SoundOutlined,
  kiosk: TabletOutlined,
  // Status
  online: CheckCircleOutlined,
  warning: WarningOutlined,
  offline: DisconnectOutlined,
  noHeartbeat: ExclamationCircleOutlined,
  // Actions
  createPublication: SendOutlined,
  createPlaylist: UnorderedListOutlined,
  createProgram: ProjectOutlined,
  uploadMedia: CloudUploadOutlined,
  addChannel: PlusCircleOutlined,
  scheduleProgram: ScheduleOutlined,
  // Device info
  brightness: SunOutlined,
  network: WifiOutlined,
} as const;
export type MediaIconName = keyof typeof MediaIcon;

/** Channel type → icon, for tables, tiles and filters. */
export const channelTypeIcon = { Screen: MediaIcon.screen, TV: MediaIcon.tv, PA: MediaIcon.pa, Kiosk: MediaIcon.kiosk } as const;

/** @deprecated Media projects on mw-theme 0.1: use mediaStatus. */
export const mwStatus = mediaStatus;
/** @deprecated Media projects on mw-theme 0.1: use T1Icon for platform concepts and MediaIcon for Media ones. */
export const MwIcon = { ...T1Icon, ...MediaIcon } as const;
