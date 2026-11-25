"use client";

import { useEffect, useState } from "react";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetsFilters } from "../../services/assets-list-api";
import { seededRead } from "../../services/seeded-read";
import type { WarrantyFirstData } from "../../services/warranty-first-data";
import { asProfileRead, FIRST_WARRANTY_SEARCH, searchWarrantyAssets } from "../../services/warranty-write";

/** Select Asset's search, filters, page and rows. The page keeps them, so Back shows them again without another read. */
export function useWarrantySelect(context: string, first: WarrantyFirstData | undefined, enabled: boolean) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(FIRST_WARRANTY_SEARCH);
  useEffect(() => {
    const timer = setTimeout(() => setQuery((previous) => previous.q === search.trim() ? previous : { ...previous, q: search.trim(), page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const request = JSON.stringify(query);
  const list = useProfileRead(`${context}:warranty-search:${request}`, (signal) => seededRead(first?.list, request,
    async () => asProfileRead(await searchWarrantyAssets(context, query, signal))), enabled);
  const filters = useProfileRead(`${context}:assign-filters`,
    (signal) => seededRead(first?.filters, context, () => getAssetsFilters(context, signal)), enabled);
  return { search, setSearch, query, setQuery, list, filters };
}

export type WarrantySelect = ReturnType<typeof useWarrantySelect>;
