export type SortMode = "relevance" | "priceAscending" | "priceDescending";

export interface CatalogQueryState {
  term: string;
  location: string;
  start: number | null;
  end: number | null;

  inclNoSuitable: boolean;
  pubEv: boolean;
  regEv: boolean;
  cities: string[];
  price: number[];

  sortMode: SortMode;
}
