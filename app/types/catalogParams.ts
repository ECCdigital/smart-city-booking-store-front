export type SortMode = "relevance" | "priceAscending" | "priceDescending";

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

  customFields: Record<string, any>
}
