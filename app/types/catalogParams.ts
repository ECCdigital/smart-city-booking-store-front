export type SortMode =
  | "alphabeticAscending"
  | "alphabeticDescending"
  | "priceAscending"
  | "priceDescending"
  | "distanceAscending"
  | "distanceDescending";
export type ViewMode = "list" | "map";

/** A search period, in epoch milliseconds; either end may be open. */
export interface TimePeriod {
  start: number | null;
  end: number | null;
}

/**
 * What a custom-field filter can hold, as the URL parser produces it: a
 * checkbox, a number, a free-text value, a multi-select, or a numeric range.
 */
export type CustomFieldValue =
  | boolean
  | number
  | string
  | string[]
  | [number, number];

export interface CatalogQueryState {
  term: string;
  location: string;
  distance: number | null;
  start: number | null;
  end: number | null;

  inclNoSuitable: boolean;
  pubEv: boolean;
  regEv: boolean;
  cat: string[];
  cities: string[];
  price: number[];

  sortMode: SortMode;
  viewMode: ViewMode;

  customFields: Record<string, CustomFieldValue>;
}
