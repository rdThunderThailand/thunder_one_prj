import type { TagCount } from "./TagsRail";

type TaggedItem = { tags?: { id: string; name: string }[]; [key: string]: unknown };

export function tagCounts<T extends TaggedItem>(items: readonly T[]): TagCount[] {
  const byId = new Map<string, TagCount>();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      const existing = byId.get(tag.id);
      if (existing) existing.count += 1;
      else byId.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterByTag<T extends TaggedItem>(items: readonly T[], tagId: string): T[] {
  return items.filter((item) => (item.tags ?? []).some((tag) => tag.id === tagId));
}
