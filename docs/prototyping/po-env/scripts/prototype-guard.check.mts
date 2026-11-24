import assert from "node:assert";
import { check } from "./prototype-guard.mjs";

const files = (path: string, content: string) => check({ changed: [], files: [{ path, content }] });
const added = (path: string) => check({ changed: [{ status: "A", path }], files: [] });

// Clean feature code passes.
assert.deepStrictEqual(files("src/app/playlists/page.tsx", '<Button className="bg-primary text-text-primary">Save</Button>'), []);
assert.deepStrictEqual(files("src/app/a/page.tsx", '<Link href="#add">x</Link>'), []);

// Token rules.
assert.strictEqual(files("src/app/a/page.tsx", '<div className="bg-zinc-100">').length, 1);
assert.strictEqual(files("src/app/a/page.tsx", '<div className="bg-white">').length, 1);
assert.strictEqual(files("src/app/a/page.tsx", 'const c = "#286EF9";').length, 1);
assert.strictEqual(files("src/app/a/page.tsx", '<div className="text-[#fff]">').length, 1);
assert.strictEqual(files("src/app/a/page.tsx", '<div className="dark:bg-surface">').length, 1);

// Reuse rules.
assert.strictEqual(files("src/app/a/page.tsx", 'import { PlusOutlined } from "@ant-design/icons";').length, 1);
assert.strictEqual(files("src/app/a/page.tsx", "<button onClick={go}>").length, 1);
assert.strictEqual(files("src/app/a/page.tsx", "<Button onClick={go}>").length, 0);

// Synced files are exempt from content rules but read only.
assert.deepStrictEqual(files("src/components/ui/lovable/button.tsx", "<button>"), []);
assert.strictEqual(check({ changed: [{ status: "M", path: "src/design-system/t1-tailwind-v4.css" }], files: [] }).length, 1);
assert.deepStrictEqual(check({ changed: [{ status: "M", path: "CONTEXT.md" }], files: [], allowSync: true }), []);

// Copy-style and duplicate-primitive names.
assert.strictEqual(added("src/app/playlists/PageV2.tsx").length, 1);
assert.strictEqual(added("src/app/playlists/new-card.tsx").length, 1);
assert.strictEqual(added("src/app/playlists/playlist-card-copy.tsx").length, 1);
assert.strictEqual(added("src/app/playlists/components/button.tsx").length, 1);
assert.deepStrictEqual(added("src/app/playlists/playlist-card.tsx"), []);
assert.deepStrictEqual(check({ changed: [{ status: "M", path: "src/app/playlists/new-card.tsx" }], files: [] }), []);

// 3-digit hex in style strings, and mocks may hold hex data.
assert.strictEqual(files("src/app/a/page.tsx", '<div style={{ color: "#fff" }}>').length, 1);
assert.strictEqual(files("src/app/a/styles.css", ".x { background-color: #abc; }").length, 1);
assert.deepStrictEqual(files("src/app/a/page.tsx", '<Link href="#add">add</Link>'), []);
assert.deepStrictEqual(files("src/mocks/assets.ts", 'background_color: "#286EF9",'), []);
assert.strictEqual(files("src/mocks/assets.ts", 'className: "bg-zinc-50",').length, 1);

// "new" only as a copy marker, not in a descriptive name.
assert.deepStrictEqual(added("src/app/playlists/new-playlist-dialog.tsx"), []);
assert.strictEqual(added("src/app/playlists/playlist-card-new.tsx").length, 1);
assert.strictEqual(added("src/app/playlists/PageNew.tsx").length, 1);
assert.deepStrictEqual(check({ changed: [{ status: "A", path: "src/lib/media-kind.ts" }], files: [], allowSync: true }), []);
assert.strictEqual(check({ changed: [{ status: "M", path: "src/lib/media-kind.ts" }], files: [] }).length, 1);

// Enforce the prototype component table, including canonical consolidated paths.
const imp = (path: string) => files("src/app/a/page.tsx", `import { X } from "${path}";`).length;
for (const off of ["lovable/button", "lovable/tabs", "lovable/dialog", "lovable/badge", "lovable/input", "lovable/skeleton", "lovable/progress"]) {
  assert.strictEqual(imp(`@/components/ui/${off}`), 1, off);
}
for (const ok of ["Button", "Tabs", "Dialog", "Modal", "Badge", "Tag", "Input", "TextField", "Skeleton", "ProgressBar", "SearchInput", "EmptyState"]) {
  assert.strictEqual(imp(`@/components/ui/${ok}`), 0, ok);
}

assert.deepStrictEqual(files("src/app/a/page.tsx", 'import { Badge, StatusBadge } from "@/components/ui/Badge"; import { Tag } from "@/components/ui/Tag";'), []);

// Canonical state exports are allowed; migrated core exports redirect to ui paths.
assert.deepStrictEqual(files("src/app/a/page.tsx", 'import { EmptyState, ErrorState } from "@/components/ui/EmptyState";'), []);
for (const name of ["SearchInput", "EmptyState", "ErrorState", "StatusBadge"]) {
  const source = `import { ${name} as State } from "@/components/ui/lovable/core";`;
  assert.strictEqual(files("src/app/a/page.tsx", source).length, 1, name);
}
assert.strictEqual(files("src/app/a/page.tsx", `import {
  IconButton,
  SearchInput as Search,
  ErrorState,
} from "@/components/ui/lovable/core";`).length, 2);
assert.strictEqual(files("src/app/a/page.tsx", 'export { EmptyState as State } from "@/components/ui/lovable/core";').length, 1);
assert.deepStrictEqual(files("src/app/a/page.tsx", 'import { IconButton, LoadingState } from "@/components/ui/lovable/core";'), []);
assert.deepStrictEqual(files("src/app/a/page.tsx", 'import { IconButton as SearchInput } from "@/components/ui/lovable/core";'), []);
assert.deepStrictEqual(files("src/components/ui/lovable/core.tsx", 'export { ErrorState } from "../EmptyState";'), []);

console.log("prototype-guard checks pass");
