/**
 *     node src/features/media-workspace/in-use/in-use-links.check.mts
 */
import assert from "node:assert/strict";
import {
  groupDeleteLinks,
  playlistTrashLinks,
  programLinks,
  removedZoneIds,
  templateZoneLinks,
} from "./in-use-links.ts";

// A Draft goes to the detail page, not the wizard.
const draft = { id: "p1", name: "Draft promo", status: "draft" };
assert.deepEqual(programLinks([draft]), [{ href: "/media-workspace/program/p1", label: "Draft promo" }]);

// A Group blocker that is over says so; a live one does not.
assert.deepEqual(
  groupDeleteLinks([
    { id: "a", name: "A", status: "cancelled", effective_status: "cancelled" },
    { id: "b", name: "B", status: "active", effective_status: "ended" },
    { id: "c", name: "C", status: "active", effective_status: "active" },
  ]),
  [
    { href: "/media-workspace/program/a", label: "A (Cancelled)" },
    { href: "/media-workspace/program/b", label: "B (Ended)" },
    { href: "/media-workspace/program/c", label: "C" },
  ],
);

// Trash blockers follow the stored status: cancelled is dropped, active-but-ended is kept.
const ended = { id: "b", name: "B", status: "active", effective_status: "ended" };
assert.deepEqual(
  playlistTrashLinks([{ id: "a", name: "A", status: "cancelled" }, ended, draft]).map((link) => link.label),
  ["B", "Draft promo"],
);

// A new Zone (no id) is ignored; a kept id is not removed.
assert.deepEqual(removedZoneIds(["z1", "z2"], [{ id: "z1" }, {}]), ["z2"]);

assert.deepEqual(templateZoneLinks(undefined, ["z2"]), []);
assert.deepEqual(
  templateZoneLinks(
    [
      { id: "kept", name: "Kept only", zone_ids: ["z1"], in_trash: false },
      { id: "hit", name: "Menu", zone_ids: ["z1", "z2"], in_trash: false },
      { id: "bin", name: "Old", zone_ids: ["z2"], in_trash: true },
    ],
    ["z2"],
  ),
  [
    { href: "/media-workspace/layouts/hit", label: "Menu" },
    { href: "/media-workspace/layouts/bin", label: "Old (ในถังขยะ)" },
  ],
);

console.log("in-use-links.check.mts — all assertions passed");
