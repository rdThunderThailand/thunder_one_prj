// Enforces the AGENTS.md rules an AI is most likely to break: design-system tokens, reuse of
// primitives, read-only synced files, and "edit in place, never grow a copy".
// Usage: node scripts/prototype-guard.mjs   (BASE=<git ref> to diff against; default origin/main, then main)
// Checks committed changes since BASE plus staged, unstaged and untracked files.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Keep in step with scripts/sync-from-thunder-one.sh.
export const SYNCED = [
  "src/components/ui/",
  "src/design-system/",
  "src/config/nav/",
  "src/lib/utils.ts",
  "src/lib/media-kind.ts",
  "src/types/domain.ts",
  "src/app/globals.css",
  "public/brand/",
  ".agents/skills/",
  ".claude/skills/",
  "CONTEXT.md",
  "SYNCED_FROM",
];

const PRIMITIVES = [
  "alert-dialog", "badge", "button", "checkbox", "dialog", "dropdown-menu", "input", "label",
  "popover", "progress", "select", "sheet", "skeleton", "switch", "tabs", "textarea",
];

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const CONTENT_RULES = [
  [new RegExp(`\\b[a-z-]+-(?:${PALETTE})-\\d{2,3}\\b`), "raw palette class: use design-system tokens"],
  [/\b(?:bg|text|border)-(?:white|black)\b/, "raw white/black class: use design-system tokens"],
  [/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\[#[0-9a-fA-F]{3,8}\]|(?:color|background|border|fill|stroke|outline|shadow)[\w-]*["']?\s*:\s*["'`]?#[0-9a-fA-F]{3,4}\b/i, "hex colour: use design-system tokens", "hex"],
  [/\bdark:/, "dark: variant: not allowed"],
  [/from\s+["']@ant-design\/icons/, "import icons from @/components/ui/icons"],
  [/<(?:button|select|input|textarea|dialog)[\s>/]/, "raw form element: use the design-system components in AGENTS.md"],
];

// Paths blocked by the prototype component table → the supported path.
// Consolidated legacy aliases remain compatible, but new feature code uses canonical ui paths.
// Keep in step with "Components follow the Thunder design system" in AGENTS.md.
const OFF_SPEC = {
  "@/components/ui/lovable/button": "@/components/ui/Button",
  "@/components/ui/lovable/tabs": "@/components/ui/Tabs",
  "@/components/ui/lovable/input": "@/components/ui/Input",
  "@/components/ui/lovable/dialog": "@/components/ui/Dialog",
  "@/components/ui/lovable/badge": "@/components/ui/Badge",
  "@/components/ui/lovable/skeleton": "@/components/ui/Skeleton",
  "@/components/ui/lovable/progress": "@/components/ui/ProgressBar",
};
for (const [from, to] of Object.entries(OFF_SPEC)) {
  CONTENT_RULES.push([new RegExp(`from\\s+["']${from.replaceAll("/", "\\/")}["']`), `component path: use ${to} (prototype component table)`]);
}

const CORE_REPLACEMENTS = {
  StatusBadge: "@/components/ui/Badge",
  SearchInput: "@/components/ui/SearchInput",
  EmptyState: "@/components/ui/EmptyState",
  ErrorState: "@/components/ui/EmptyState",
};

const COPY_WORDS = new Set(["v2", "v3", "v4", "copy", "old", "backup", "final", "temp"]);
// "new" is only a copy marker as a suffix (card-new, PageNew) or as "new" + one word (NewCard,
// new-page). Names like new-playlist-dialog describe a "create" feature and are fine.
const isCopyName = (words) =>
  words.some((w) => COPY_WORDS.has(w)) ||
  (words.length > 1 && words.at(-1) === "new") ||
  (words.length === 2 && words[0] === "new");
// Mock data may carry colour values as data (e.g. background_color); only the hex rule is lifted.
const isMock = (path) => path.startsWith("src/mocks/");

const isSynced = (path) => SYNCED.some((p) => path === p || path.startsWith(p));
const isFeatureCode = (path) => /^src\/.*\.(tsx|ts|css)$/.test(path) && !isSynced(path);

function nameWords(path) {
  const base = path.split("/").pop().replace(/\.[^.]+$/, "");
  return base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().split(/[-_.]/);
}

/**
 * @param {{ changed: { status: string, path: string }[], files: { path: string, content: string }[], allowSync?: boolean }} input
 * @returns {string[]} violations
 */
export function check({ changed, files, allowSync = false }) {
  const out = [];
  for (const { status, path } of changed) {
    if (isSynced(path) && !allowSync) out.push(`${path}: synced file is read only (run the sync script on a sync/* branch)`);
    if (status !== "A" || isSynced(path)) continue;
    const words = nameWords(path);
    if (isCopyName(words)) out.push(`${path}: copy-style name: edit the existing file instead`);
    if (path.startsWith("src/") && PRIMITIVES.includes(words.join("-"))) out.push(`${path}: duplicates a shared primitive in src/components/ui`);
  }
  for (const { path, content } of files) {
    if (!isFeatureCode(path)) continue;
    // Scan whole import/export statements so multiline lists and aliases use the imported name.
    const coreImports = /\b(?:import|export)\s*(?:type\s+)?\{([^}]+)\}\s*from\s*["']@\/components\/ui\/lovable\/core["']/g;
    for (const match of content.matchAll(coreImports)) {
      for (const specifier of match[1].split(",")) {
        const name = specifier.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
        if (!Object.hasOwn(CORE_REPLACEMENTS, name)) continue;
        const line = content.slice(0, match.index).split("\n").length;
        out.push(`${path}:${line}: migrated core component: import ${name} from ${CORE_REPLACEMENTS[name]}`);
      }
    }
    content.split("\n").forEach((line, i) => {
      for (const [re, msg, kind] of CONTENT_RULES) {
        if (kind === "hex" && isMock(path)) continue;
        if (re.test(line)) out.push(`${path}:${i + 1}: ${msg}`);
      }
    });
  }
  return out;
}

const git = (args) => execSync(`git ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const lines = (text) => text.split("\n").filter(Boolean);
const refExists = (ref) => {
  try {
    git(`rev-parse --verify --quiet ${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
};

function resolveBase() {
  const candidates = process.env.BASE ? [process.env.BASE] : ["origin/main", "main"];
  const found = candidates.find(refExists);
  if (!found) console.warn(`prototype guard: no base ref (${candidates.join(", ")}); checking uncommitted files only`);
  return found;
}

function currentBranch() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  try {
    return git("rev-parse --abbrev-ref HEAD").trim();
  } catch {
    return "";
  }
}

function main() {
  const base = resolveBase();
  const status = new Map();
  const add = (text) => {
    for (const l of lines(text)) {
      const [s, path] = l.split("\t");
      if (status.get(path) !== "A") status.set(path, s);
    }
  };
  if (base && refExists("HEAD")) add(git(`diff --name-status --no-renames ${base}...HEAD`));
  if (refExists("HEAD")) add(git("diff --name-status --no-renames HEAD"));
  for (const path of lines(git("ls-files --others --exclude-standard"))) status.set(path, "A");
  const changed = [...status].map(([path, s]) => ({ status: s, path }));
  const files = lines(git("ls-files --cached --others --exclude-standard src"))
    .filter((path) => existsSync(path))
    .map((path) => ({ path, content: readFileSync(path, "utf8") }));
  const allowSync = currentBranch().startsWith("sync/");
  const violations = check({ changed, files, allowSync });
  for (const v of violations) console.error(v);
  if (violations.length) process.exit(1);
  console.log("prototype guard: ok");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
