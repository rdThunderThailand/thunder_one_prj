import assert from "node:assert/strict";
import { publicationPreviewTarget } from "./publication-preview-target.ts";
import type { PublicationDetail } from "../publications/types/index.ts";

const base = { id: "publication", name: "Test", publication_type: "playlist", priority: "normal", status: "draft", tags: [] } satisfies PublicationDetail;

assert.deepEqual(
  publicationPreviewTarget({ ...base, playlist: { id: "playlist", name: "Loop" } }),
  { kind: "playlist", id: "playlist" },
);
assert.deepEqual(
  publicationPreviewTarget({ ...base, publication_type: "composition", composition: { id: "composition", name: "Layout", status: "draft" } }),
  { kind: "composition", id: "composition" },
);
assert.equal(publicationPreviewTarget(base), null);
assert.equal(publicationPreviewTarget({ ...base, publication_type: "video", playlist: { id: "playlist", name: "Loop" } }), null);

console.log("publication-preview-target.check.mts OK");
