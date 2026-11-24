// Media Workspace editors get the "focus" shell (ADR 0077): no Topbar and a
// sidebar that starts collapsed, so the canvas gets the width and height the
// Lovable reference gives it. Lists, detail pages and wizards keep the full shell.
const EDITOR_PARENTS = ["/media-workspace/playlists", "/media-workspace/layouts/templates", "/media-workspace/layouts"];

export function isEditorRoute(pathname: string): boolean {
  const parent = EDITOR_PARENTS.find((p) => pathname.startsWith(`${p}/`));
  if (!parent) return false;
  const rest = pathname.slice(parent.length + 1);
  // One more segment (an id or `create`) and nothing else; `/layouts/templates`
  // itself is a list, which the templates prefix above already claimed.
  return rest !== "" && !rest.includes("/") && rest !== "templates";
}
