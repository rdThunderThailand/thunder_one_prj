"use client";

import { FilterIcon, GridIcon, ListIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/lovable/select";
import { LibrarySearch } from "../../content-library/LibraryShell";
import { DISPLAY_STATUS_LABELS } from "../publication-list-display";
import { DISPLAY_STATUSES, type PublicationListSort } from "../types";

export type FilterOptions = {
  channels: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  tags: { id: string; name: string }[];
};

export type ListFilters = {
  search: string;
  status: string;
  /** "all" | "channel:<id>" | "group:<id>" — one control, the backend takes one or the other. */
  target: string;
  tag: string;
  sort: PublicationListSort;
};

export const DEFAULT_FILTERS: ListFilters = {
  search: "",
  status: "all",
  target: "all",
  tag: "all",
  sort: "updated_desc",
};

const SORT_LABELS: Record<PublicationListSort, string> = {
  updated_desc: "Last updated: newest first",
  name_asc: "Name: A → Z",
  starts_desc: "Start date: newest first",
  created_desc: "Created: newest first",
};

const triggerClass = "h-9 w-32 text-[10px] shadow-none";
const SOON = "เร็วๆ นี้";

// Created by is left out: the API filters on it (`created_by`), but there is no user list this
// role can read to fill the options, and deriving them from the visible page would be misleading.
export function PublicationsFilterBar({
  value,
  options,
  onChange,
}: {
  value: ListFilters;
  options: FilterOptions;
  onChange: (patch: Partial<ListFilters>) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <LibrarySearch
        value={value.search}
        onChange={(search) => onChange({ search })}
        placeholder="Search programs…"
      />
      <Select
        value={value.status}
        onValueChange={(status) => onChange({ status })}
      >
        <SelectTrigger
          className={triggerClass}
          aria-label="Status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {DISPLAY_STATUSES.map((status) => (
            <SelectItem
              key={status}
              value={status}
            >
              {DISPLAY_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.target}
        onValueChange={(target) => onChange({ target })}
      >
        <SelectTrigger
          className={triggerClass}
          aria-label="Target"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Targets</SelectItem>
          {options.channels.length > 0 && (
            <SelectGroup>
              <SelectLabel>Channels</SelectLabel>
              {options.channels.map((channel) => (
                <SelectItem
                  key={channel.id}
                  value={`channel:${channel.id}`}
                >
                  {channel.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {options.groups.length > 0 && (
            <SelectGroup>
              <SelectLabel>Channel Groups</SelectLabel>
              {options.groups.map((group) => (
                <SelectItem
                  key={group.id}
                  value={`group:${group.id}`}
                >
                  {group.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
      <Select
        value={value.tag}
        onValueChange={(tag) => onChange({ tag })}
      >
        <SelectTrigger
          className={triggerClass}
          aria-label="Tag"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tags</SelectItem>
          {options.tags.map((tag) => (
            <SelectItem
              key={tag.id}
              value={tag.id}
            >
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled
        title={SOON}
        className="h-9 text-[10px]"
      >
        <FilterIcon className="h-3.5 w-3.5" />
        More filters
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <div
          className="flex items-center gap-1"
          title={SOON}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            aria-label="List view"
            aria-pressed="true"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Grid view"
            disabled
          >
            <GridIcon className="h-4 w-4" />
          </Button>
        </div>
        <Select
          value={value.sort}
          onValueChange={(sort) => onChange({ sort: sort as PublicationListSort })}
        >
          <SelectTrigger
            className="h-9 w-48 text-[10px] shadow-none"
            aria-label="Sort"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as PublicationListSort[]).map((sort) => (
              <SelectItem
                key={sort}
                value={sort}
              >
                {SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
