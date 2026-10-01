/** Run: node src/features/media-workspace/publications/publication-list-query.check.mts */
import assert from "node:assert/strict";
import { buildPublicationListQuery } from "./publication-list-query.ts";

assert.equal(buildPublicationListQuery({}), "");
assert.equal(buildPublicationListQuery({ search: "  ", tag_id: "" }), "");
assert.equal(
  buildPublicationListQuery({ display_status: "live", page: 2, limit: 10, search: " sale " }),
  "?display_status=live&page=2&limit=10&search=sale"
);
assert.equal(buildPublicationListQuery({ channel_id: "a b" }), "?channel_id=a+b");
