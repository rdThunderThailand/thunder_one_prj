/* Copy of packages/thunderone-theme/src/antd.ts, synced by scripts/build.mjs. Prefer: npm i @rdthunderthailand/thunderone-theme */
/**
 * ThunderOne — Ant Design theme (antd v5), shared by every Workspace.
 * Hand-written mapping from design tokens to antd. Values come from ./tokens (generated from tokens.json).
 *
 *   import { ConfigProvider, App } from 'antd';
 *   import { t1Theme } from '@rdthunderthailand/thunderone-theme/antd';
 *   <ConfigProvider theme={t1Theme}><App>...</App></ConfigProvider>
 *
 * Workspace state mappings (e.g. Media "Online") live in ./workspaces/<key>.
 */
import type { ThemeConfig } from 'antd';
import { t1Tokens } from './t1-tokens';

export { t1Tokens };

/** Semantic status → antd Badge `status` + tokens. Workspaces map their own states onto these. Never invent other status colors. */
export const t1Status = {
  success: { badge: 'success', color: t1Tokens.status.success, bg: t1Tokens.status.successBg },
  warning: { badge: 'warning', color: t1Tokens.status.warning, bg: t1Tokens.status.warningBg },
  error: { badge: 'error', color: t1Tokens.status.error, bg: t1Tokens.status.errorBg },
  info: { badge: 'processing', color: t1Tokens.status.info, bg: t1Tokens.status.infoBg },
  inProgress: { badge: 'processing', color: t1Tokens.status.inProgress, bg: t1Tokens.status.inProgressBg },
} as const;
export type T1Status = keyof typeof t1Status;

const t = t1Tokens;

export const t1Theme: ThemeConfig = {
  cssVar: true,
  hashed: false,
  token: {
    // Brand & semantic
    colorPrimary: t.action.primary,
    colorInfo: t.status.info,
    colorSuccess: t.status.success,
    colorWarning: t.status.warning,
    colorError: t.status.error,
    colorLink: t.text.brand,
    colorLinkHover: t.action.primaryHover,
    colorLinkActive: t.action.primaryPressed,

    // Text
    colorText: t.text.primary,
    colorTextHeading: t.text.primary,
    colorTextSecondary: t.text.secondary,
    colorTextTertiary: t.text.tertiary,
    colorTextQuaternary: t.text.tertiary,
    colorTextPlaceholder: t.text.tertiary,
    colorTextDisabled: t.text.tertiary,

    // Surfaces & borders
    colorBgLayout: t.bg.primary,
    colorBgContainer: t.surface.default,
    colorBgElevated: t.surface.default,
    colorBgSpotlight: t.surface.overlay,
    colorFillTertiary: t.bg.primaryStrong,
    colorFillQuaternary: t.bg.primary,
    colorBorder: t.border.default,
    colorBorderSecondary: t.border.subtle,
    colorSplit: t.border.subtle,
    controlOutline: t.action.subduedMenu,
    controlItemBgActive: t.action.subduedMenu,
    controlItemBgHover: t.bg.primaryStrong,

    // Type
    fontFamily: t.font,
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    fontWeightStrong: 700,

    // Shape & size
    borderRadiusXS: t.radius.xs,
    borderRadiusSM: t.radius.md,
    borderRadius: t.radius.lg,
    borderRadiusLG: t.radius.xl,
    controlHeight: 32,
    controlHeightSM: 24,
    controlHeightLG: 40,
    boxShadow: t.shadow.dropdown,
    boxShadowSecondary: t.shadow.dropdown,
    boxShadowTertiary: t.shadow.card,
  },
  components: {
    Layout: { siderBg: t.surface.default, headerBg: 'rgba(249, 250, 251, 0.95)', headerHeight: t.layout.header, headerPadding: `0 ${t.layout.contentPaddingX}px`, bodyBg: t.bg.primary },
    Menu: {
      itemHeight: 32, itemBorderRadius: t.radius.md, itemMarginInline: 8, iconSize: 16,
      itemColor: t.text.secondary, itemHoverColor: t.text.primary, itemHoverBg: t.bg.primaryStrong,
      itemSelectedBg: t.action.subduedMenu, itemSelectedColor: t.action.primary,
      groupTitleColor: t.text.secondary, groupTitleFontSize: 11,
    },
    Button: { fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
    Card: { borderRadiusLG: t.radius.xl, paddingLG: t.layout.cardPadding, headerFontSize: 14, boxShadowTertiary: t.shadow.card },
    Table: {
      headerBg: t.bg.primary, headerColor: t.text.secondary, headerSplitColor: 'transparent',
      rowHoverBg: t.bg.primary, rowSelectedBg: t.action.subduedMenu, rowSelectedHoverBg: t.action.subdued2,
      cellPaddingBlock: 12, borderColor: t.border.subtle,
    },
    Segmented: { trackBg: t.bg.primaryStrong, itemSelectedColor: t.text.primary, itemColor: t.text.secondary },
    Input: { activeShadow: `0 0 0 3px ${t.action.subduedMenu}` },
    Select: { optionSelectedBg: t.action.subduedMenu, optionSelectedFontWeight: 600 },
    Tag: { defaultBg: t.surface.default, defaultColor: t.text.secondary },
    Badge: { dotSize: 6, statusSize: 6 },
    Drawer: { paddingLG: 20 },
    Modal: { borderRadiusLG: t.radius.xl },
    Tooltip: { colorBgSpotlight: t.surface.overlay },
    Descriptions: { labelColor: t.text.secondary },
  },
};

export default t1Theme;

/** @deprecated Renamed to t1Theme / t1Tokens. Removed in the next major. */
export const mwTheme = t1Theme;
/** @deprecated Use t1Tokens. */
export const mwTokens = t1Tokens;

