import assert from "node:assert/strict";
import { detailToDraft } from "./detail-mapping.ts";
import type { PublicationDetail } from "./types/index.ts";

const compositionPublication = {
  id: "publication-1",
  name: "Composition draft",
  publication_type: "composition",
  priority: "normal",
  status: "draft",
  tags: [],
  composition: { id: "composition-1", name: "Menu Board", status: "active" },
} satisfies PublicationDetail;

const draft = detailToDraft(compositionPublication);
assert.equal(draft.compositionId, "composition-1");

const playlistPublication = {
  ...compositionPublication,
  publication_type: "playlist",
  composition: null,
} satisfies PublicationDetail;

assert.equal(detailToDraft(playlistPublication).compositionId, null);

console.log("detail-mapping.check.mts — all assertions passed");
