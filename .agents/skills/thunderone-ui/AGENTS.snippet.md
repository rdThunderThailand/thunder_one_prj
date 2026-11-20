## ThunderOne design system

ThunderOne workspace: {{WORKSPACE}}

Any UI work in this project MUST follow the `thunderone-ui` skill (`.agents/skills/thunderone-ui/SKILL.md`) and its Workspace profile `references/workspaces/{{WORKSPACE}}.md`. Read both before creating, editing or reviewing screens or components.

Always-on rules:
- Theme comes from `@rdthunderthailand/thunderone-theme`. Ant Design: `t1Theme` from `…/antd` in `<ConfigProvider>` plus `…/global.css`. Tailwind/shadcn: preset `…/tailwind/preset` (v3) or `…/tailwind/v4.css` (v4). Never write your own theme, never ship Ant Design's #1677FF, never use Tailwind's default palette or arbitrary hex classes.
- No hardcoded colors, font sizes, radii or shadows. Use tokens.
- Platform shell is fixed: sidebar 224px, header 69px, content padding 24px, card gap 12px, card radius 16px. Nav contents come from the Workspace profile.
- Status colors only from status tokens, through the profile's status mapping. Never use status colors for categories or tags.
- Font: Manrope. Brand/primary: #286EF9.
- Icons: `@ant-design/icons` through `T1Icon` (`…/icons`) or the Workspace icon map. Logos: only the SVGs in `…/brand/`.
- Every data surface has loading, empty and error states. Reuse existing components; if one is missing, say so.
- Sentence case, 24h time, the Workspace's exact vocabulary.

Design system repo: https://github.com/rdThunderThailand/-thunder-design-system
