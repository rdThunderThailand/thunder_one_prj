"use client";

// Client module: @ant-design/icons reads a React context, which Server Components cannot create.
// The app's icon set, drawn from @ant-design/icons (DS-09, ADR 0096). Platform concepts go through
// the design system's T1Icon map so the same concept keeps the same glyph everywhere; the rest pick
// Outlined icons from the `media` profile map or the antd set. Each export keeps the Tailwind sizing
// API the app already uses: `className` sets the box, the glyph fills it.
import type { ComponentType } from "react";
import {
  AudioMutedOutlined,
  AimOutlined,
  ApartmentOutlined,
  ApiOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  AudioOutlined,
  BankOutlined,
  BgColorsOutlined,
  BlockOutlined,
  BookOutlined,
  BorderOutlined,
  BulbOutlined,
  CameraOutlined,
  CaretRightOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  CloseCircleOutlined,
  ColumnWidthOutlined,
  CommentOutlined,
  CopyOutlined,
  CustomerServiceOutlined,
  DesktopOutlined,
  DollarOutlined,
  DownOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  FileAddOutlined,
  FileImageOutlined,
  FileOutlined,
  FileSearchOutlined,
  FileUnknownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FullscreenOutlined,
  FundProjectionScreenOutlined,
  HeartOutlined,
  HomeOutlined,
  HourglassOutlined,
  ImportOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LayoutOutlined,
  LinkOutlined,
  LoadingOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  MessageOutlined,
  MinusOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlaySquareOutlined,
  ProfileOutlined,
  ProjectOutlined,
  ReadOutlined,
  RedoOutlined,
  RestOutlined,
  RetweetOutlined,
  RiseOutlined,
  RobotOutlined,
  RocketOutlined,
  RollbackOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  SendOutlined,
  ShareAltOutlined,
  SlidersOutlined,
  SmileOutlined,
  SoundOutlined,
  StarFilled,
  StarOutlined,
  StopOutlined,
  SwapOutlined,
  TabletOutlined,
  TagOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UndoOutlined,
  UnorderedListOutlined,
  UpOutlined,
  UserDeleteOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { T1Icon } from "@/design-system/t1-icons";
import { cn } from "@/lib/utils";

export interface IconProps {
  className?: string;
}

export type Icon = ComponentType<IconProps>;

type Glyph = ComponentType<{ className?: string }>;

function icon(Glyph: Glyph, defaultClassName = "h-4 w-4"): Icon {
  function AppIcon({ className = defaultClassName }: IconProps) {
    // antd injects an unlayered `.anticon { display: inline-flex }` that beats every Tailwind utility,
    // so the caller's classes go on an outer span: block-level like the svg it replaces (preflight
    // makes svg `display: block`), and `hidden` / `sm:block` from the caller still win via cn.
    return (
      <span
        aria-hidden
        className={cn("flex shrink-0 items-center justify-center", className)}
      >
        <Glyph className="h-full w-full [&>svg]:h-full [&>svg]:w-full" />
      </span>
    );
  }
  AppIcon.displayName = Glyph.displayName ?? "AppIcon";
  return AppIcon;
}

// Shell and platform concepts (T1Icon)
export const SearchIcon = icon(T1Icon.search);
export const BellIcon = icon(T1Icon.notifications, "h-5 w-5");
export const HelpIcon = icon(T1Icon.help, "h-5 w-5");
export const GaugeIcon = icon(T1Icon.overview);
export const PanelCloseIcon = icon(T1Icon.collapse);
export const PanelOpenIcon = icon(T1Icon.expand);
export const UserIcon = icon(T1Icon.user);
export const GlobeIcon = icon(T1Icon.language);
export const LanguageIcon = icon(T1Icon.language);
export const CheckCircleIcon = icon(T1Icon.success);
export const WarningTriangleIcon = icon(T1Icon.warning);
export const AlertCircleIcon = icon(T1Icon.error);
export const PlusIcon = icon(T1Icon.create);
export const EditIcon = icon(T1Icon.edit);
export const TrashIcon = icon(T1Icon.delete);
export const MoreIcon = icon(T1Icon.more);
export const FilterIcon = icon(T1Icon.filter);
export const RefreshIcon = icon(T1Icon.refresh);
export const SettingsIcon = icon(T1Icon.settings);
export const UploadIcon = icon(T1Icon.upload);
export const ChevronRightIcon = icon(T1Icon.linkArrow);
export const ChevronLeftIcon = icon(T1Icon.back);
export const XIcon = icon(T1Icon.close);
export const ExternalLinkIcon = icon(T1Icon.externalLink);
export const CalendarIcon = icon(T1Icon.calendar);
export const ClockIcon = icon(T1Icon.time);
export const FileTextIcon = icon(T1Icon.reports);
export const ChartIcon = icon(T1Icon.analytics);
export const DesignIcon = icon(BgColorsOutlined);

// Media concepts (thunderone-ui `media` profile icon map)
export const ImageIcon = icon(PictureOutlined);
export const PlaylistIcon = icon(UnorderedListOutlined);
export const ListIcon = icon(UnorderedListOutlined);
export const LayoutIcon = icon(LayoutOutlined);
export const BroadcastIcon = icon(ApartmentOutlined);
export const MonitorIcon = icon(DesktopOutlined);
export const MonitorPlayIcon = icon(FundProjectionScreenOutlined);
export const MegaphoneIcon = icon(SoundOutlined);
export const MuteIcon = icon(AudioMutedOutlined);
export const EyeIcon = icon(EyeOutlined);
export const HeartIcon = icon(HeartOutlined);
export const PaperPlaneIcon = icon(SendOutlined);
export const ScheduleIcon = icon(ScheduleOutlined);
export const ProgramIcon = icon(ProjectOutlined);
export const NowNextIcon = icon(PlayCircleOutlined);
export const KioskIcon = icon(TabletOutlined);
export const ActivityIcon = icon(T1Icon.activity);

// Other concepts (antd Outlined)
export const FolderIcon = icon(FolderOutlined);
export const FolderOpenIcon = icon(FolderOpenOutlined);
export const FolderMoveIcon = icon(ImportOutlined);
export const FileIcon = icon(FileOutlined);
export const FileImageIcon = icon(FileImageOutlined);
export const FilePlusIcon = icon(FileAddOutlined);
export const FileQuestionIcon = icon(FileUnknownOutlined);
export const SearchXIcon = icon(FileSearchOutlined);
export const VideoIcon = icon(VideoCameraOutlined);
export const AudioIcon = icon(AudioOutlined);
export const ChevronDownIcon = icon(DownOutlined);
export const ChevronUpIcon = icon(UpOutlined);
export const ArrowRightIcon = icon(ArrowRightOutlined);
export const ArrowLeftIcon = icon(ArrowLeftOutlined);
export const SparklesIcon = icon(RobotOutlined);
export const GridIcon = icon(AppstoreOutlined);
export const AppAddIcon = icon(AppstoreAddOutlined);
export const LayersIcon = icon(BlockOutlined);
export const SlidersIcon = icon(SlidersOutlined);
export const LightningIcon = icon(ThunderboltOutlined);
export const ShareNodesIcon = icon(ShareAltOutlined);
export const DynamicIcon = icon(ApiOutlined);
export const EnvelopeIcon = icon(MailOutlined);
export const PhoneIcon = icon(PhoneOutlined);
export const PlayIcon = icon(CaretRightOutlined);
export const PlaySquareIcon = icon(PlaySquareOutlined);
export const PauseCircleIcon = icon(PauseCircleOutlined);
export const CheckIcon = icon(CheckOutlined);
export const CheckSquareIcon = icon(CheckSquareOutlined);
export const XCircleIcon = icon(CloseCircleOutlined);
export const CircleIcon = icon(BorderOutlined);
export const InfoIcon = icon(InfoCircleOutlined);
export const RepeatIcon = icon(RetweetOutlined);
export const BoxIcon = icon(InboxOutlined);
export const ArchiveIcon = icon(InboxOutlined);
export const HomeIcon = icon(HomeOutlined);
export const CurrencyIcon = icon(DollarOutlined);
export const SmileIcon = icon(SmileOutlined);
export const ShieldIcon = icon(SafetyOutlined);
export const TrendUpIcon = icon(RiseOutlined);
export const HeadsetIcon = icon(CustomerServiceOutlined);
export const ClipboardIcon = icon(ProfileOutlined);
export const TimerIcon = icon(FieldTimeOutlined);
export const LightbulbIcon = icon(BulbOutlined);
export const TargetIcon = icon(AimOutlined);
export const BuildingIcon = icon(BankOutlined);
export const LockIcon = icon(LockOutlined);
export const UsersIcon = icon(TeamOutlined);
export const HourglassIcon = icon(HourglassOutlined);
export const UserMinusIcon = icon(UserDeleteOutlined);
export const MinusIcon = icon(MinusOutlined);
export const BookmarkIcon = icon(BookOutlined);
export const BookIcon = icon(ReadOutlined);
export const ExpandIcon = icon(FullscreenOutlined);
export const LogoutIcon = icon(LogoutOutlined);
export const UndoIcon = icon(UndoOutlined);
export const RedoIcon = icon(RedoOutlined);
export const CopyIcon = icon(CopyOutlined);
export const CameraIcon = icon(CameraOutlined);
export const TagIcon = icon(TagOutlined);
export const ToolIcon = icon(ToolOutlined);
export const RocketIcon = icon(RocketOutlined);
export const MenuIcon = icon(MenuOutlined);
export const DownloadIcon = icon(DownloadOutlined);
export const LinkIcon = icon(LinkOutlined);
export const RatioIcon = icon(ColumnWidthOutlined);
export const MessageIcon = icon(MessageOutlined);
export const CommentsIcon = icon(CommentOutlined);
export const SpinnerIcon = icon(LoadingOutlined);

// Asset Workspace concepts (ADR 0098 §4 icon map)
export const LocationIcon = icon(EnvironmentOutlined);
export const TransferIcon = icon(SwapOutlined);
export const ReturnIcon = icon(RollbackOutlined);
export const RetireIcon = icon(StopOutlined);
export const DisposeIcon = icon(RestOutlined);

const StarOutlineIcon = icon(StarOutlined);
const StarFilledIcon = icon(StarFilled);

export function StarIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return filled ? <StarFilledIcon className={className} /> : <StarOutlineIcon className={className} />;
}
