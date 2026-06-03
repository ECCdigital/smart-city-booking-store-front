export type SortMode =
  | "alphabeticAscending"
  | "alphabeticDescending"
  | "priceAscending"
  | "priceDescending"
  | "distanceAscending"
  | "distanceDescending";
export type ViewMode = "list" | "map";

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

  customFields: Record<string, any>;
}
