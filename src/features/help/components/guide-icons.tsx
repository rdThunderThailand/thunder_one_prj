import {
  WarningTriangleIcon as AlertTriangle,
  BookIcon as BookOpen,
  ScheduleIcon as CalendarClock,
  InfoIcon as Info,
  LayoutIcon as LayoutDashboard,
  LightbulbIcon as Lightbulb,
  PlaylistIcon as ListVideo,
  NowNextIcon as PlayCircle,
  BroadcastIcon as Radio,
  RocketIcon as Rocket,
  PaperPlaneIcon as Send,
  UploadIcon as Upload,
  XCircleIcon as XCircle,
  type Icon,
} from "@/components/ui/icons";
import type { ContentType } from "../types";

// Panel row icons (FigJam Help panel): one icon per task, so a list of tasks reads at a glance.
// Presentation only — the Guide data model stays icon-free; unknown Guides fall back by Content Type.
const BY_GUIDE: Record<string, Icon> = {
  "GDE-0001": Rocket,
  "GDE-0002": ListVideo,
  "GDE-0003": Upload,
  "GDE-0004": CalendarClock,
  "GDE-0005": Lightbulb,
  "GDE-0006": Radio,
  "GDE-0007": PlayCircle,
  "GDE-0008": Send,
  "GDE-0010": BookOpen,
  "GDE-0013": LayoutDashboard,
};

const BY_TYPE: Record<ContentType, Icon> = {
  "getting-started": Rocket,
  "how-to": BookOpen,
  concept: Lightbulb,
  troubleshooting: AlertTriangle,
  reference: Info,
};

export function guideIcon(guideId: string, type: ContentType): Icon {
  return BY_GUIDE[guideId] ?? BY_TYPE[type];
}

export type TroubleTone = "danger" | "warning" | "info";

/** How serious a troubleshooting topic is, for the coloured badge in the panel (reference: red / amber / blue). */
const TROUBLE: Record<string, { icon: Icon; tone: TroubleTone }> = {
  "GDE-0014": { icon: XCircle, tone: "danger" },
  "GDE-0009": { icon: AlertTriangle, tone: "warning" },
  "GDE-0008": { icon: AlertTriangle, tone: "warning" },
};

export function troubleIcon(guideId: string): { icon: Icon; tone: TroubleTone } {
  return TROUBLE[guideId] ?? { icon: Info, tone: "info" };
}
