# people/knowledge-base

The knowledge base (`/people/knowledge-base`) — HR Manager's "คลังความรู้" page. Nests under
`people/` per `docs/adr/0034-feature-folders-nest-under-app.md`.

> R&D placeholder — mock data, no backend yet.

- `components/`
  - `KnowledgeBasePage` — a plain Server Component, same "no selection state needed" shape as
    `people/policy`'s `PolicyPage`. Unlike every other `people/*` list page, this one has **no
    stat tiles row** — the mockup goes straight from the header into the filter bar.
  - `KnowledgeBaseHeader` — title + Export/Create-article actions, both inert
  - `KnowledgeBaseFilterBar` — search + 3 dropdown filters + grid/list toggle, all inert, laid out
    as a single row (not the 2-row search-then-filters shape `people/personnel`'s
    `PersonnelFilterBar` uses) — matches this page's own mockup
  - `KnowledgeCategoriesRow` — the 5 category tiles ("หมวดหมู่ความรู้")
  - `RecentArticlesList` — the 5-article list ("ความรู้ล่าสุด"). Thumbnails are a colored icon tile
    (`ImageIcon` on `article.thumbnailTone`), not a real photo — no image assets exist for this
    mock data. Bookmark/kebab/"โหลดเพิ่มเติม" are all inert.
  - `PopularTopicsCard` — the ranked 1–5 "หัวข้อยอดนิยม" list
  - `KnowledgeAnnouncementsCard` — the 3-item "ประกาศล่าสุด" list
  - `KnowledgeNeedHelpCard` — the static "ติดต่อ HR" prompt card
- `mock-data.ts` — `knowledgeCategories`' descriptions are a best-effort reading of a low-resolution
  mockup crop, not a character-exact transcription (unlike this feature's titles/dates, which are);
  the counts (24/18/12/15/21) are exact. `knowledgeArticles`, `popularTopics`, and
  `knowledgeAnnouncements` are all directly copied from the mockup.

**Not built yet**: every dropdown filter, search, sort, category/article click-through,
bookmark/kebab actions, "โหลดเพิ่มเติม", Export, Create Article, and the "ติดต่อ HR" button. No
article reader page or category detail page exists yet either.
