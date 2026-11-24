/* Copy of packages/thunderone-theme/src/icons.tsx, synced by scripts/build.mjs. Prefer: npm i @rdthunderthailand/thunderone-theme */
/**
 * ThunderOne platform concept → icon map (see skills/thunderone-ui/references/icons.md).
 * Shared by every Workspace. Workspace-specific icons live in ./workspaces/<key>.
 * Import icons from here instead of picking them ad hoc, so every screen uses the same icon for the same thing.
 */
import {
  DashboardOutlined, SearchOutlined, BellOutlined, QuestionCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  MoreOutlined, FilterOutlined, ReloadOutlined, SettingOutlined, RightOutlined, LeftOutlined, CloseOutlined,
  CalendarOutlined, ClockCircleOutlined, HistoryOutlined, UserOutlined, CloudUploadOutlined, FileTextOutlined,
  LineChartOutlined, GlobalOutlined, ExportOutlined, SkinOutlined, BgColorsOutlined,
} from '@ant-design/icons';

export const T1Icon = {
  // Shell
  overview: DashboardOutlined,
  search: SearchOutlined,
  notifications: BellOutlined,
  help: QuestionCircleOutlined,
  collapse: MenuFoldOutlined,
  expand: MenuUnfoldOutlined,
  user: UserOutlined,
  language: GlobalOutlined,
  // Semantic status
  success: CheckCircleOutlined,
  warning: WarningOutlined,
  error: ExclamationCircleOutlined,
  // Actions
  create: PlusOutlined,
  edit: EditOutlined,
  delete: DeleteOutlined,
  more: MoreOutlined,
  filter: FilterOutlined,
  refresh: ReloadOutlined,
  settings: SettingOutlined,
  upload: CloudUploadOutlined,
  linkArrow: RightOutlined,
  back: LeftOutlined,
  close: CloseOutlined,
  externalLink: ExportOutlined,
  // Content
  calendar: CalendarOutlined,
  time: ClockCircleOutlined,
  activity: HistoryOutlined,
  reports: FileTextOutlined,
  analytics: LineChartOutlined,
  brandAssets: SkinOutlined,
  designSystem: BgColorsOutlined,
} as const;

export type T1IconName = keyof typeof T1Icon;
