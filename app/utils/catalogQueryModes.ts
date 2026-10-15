import type { SortMode, ViewMode } from "~/types/catalogParams";

const SORT_MODES = [
  "alphabeticAscending",
  "alphabeticDescending",
  "priceAscending",
  "priceDescending",
  "distanceAscending",
  "distanceDescending",
] as const satisfies readonly SortMode[];

export function parseSortMode(value: unknown): SortMode {
  return typeof value === "string" &&
    SORT_MODES.includes(value as (typeof SORT_MODES)[number])
    ? (value as SortMode)
    : "alphabeticAscending";
}

export function parseViewMode(value: unknown): ViewMode {
  return value === "map" ? "map" : "list";
}
