# Media Workspace nav availability — 2026-09-16

- Reduced the Media Workspace brand subtitle to the annotated 14px size.
- Styled nav items without a configured route as muted inert controls, including Calendar, unbuilt channel types, Monitoring, and Reports & Analytics.
- Fixed Overview so its active treatment follows the current pathname instead of remaining highlighted on other Media Workspace routes.
- Static verification: TypeScript and `git diff --check` pass; targeted ESLint has no errors and reports five existing `img` optimization warnings in the brand markup.
- Browser verification pending user choice.
