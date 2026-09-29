import type { CustomFieldValue } from "~/types/catalogParams";
import {
  getCustomFieldValue,
  scalarCustomFieldValues,
} from "~/composables/search/useCustomFieldFilters";

/** The states a search result can be in after search and filter. */
export const MatchStatus = Object.freeze({
  MATCH: "match",
  NO_MATCH: "no-match",
  TOO_FAR: "too-far",
});

/** A custom field definition, as an item carries it. */
export interface CustomFieldDefinition {
  id?: string;
  type?: string;
  inputType?: string;
  options?: { value: unknown }[];
  usageOptions?: { catalogFilterType?: string };
}

/** What the catalog filters read off a wrapped search result. */
export interface FilterableItem {
  item: {
    id: string;
    type?: string;
    location?: {
      address?: { city?: string };
      display_address?: string;
    } | null;
    distanceMeter?: number;
    attendees?: { publicEvent?: boolean; needsRegistration?: boolean };
    customFields?: CustomFieldDefinition[];
  };
  matchStatus: string;
}

/** The filter criteria, as the query state and the filter area hold them. */
export interface CatalogFilterCriteria {
  inclNoSuitable: boolean;
  pubEv: boolean;
  regEv: boolean;
  cat: string[];
  cities: string[];
  /** Maximum distance in km; only applied when `hasLocation` is set. */
  distance: number | null;
  hasLocation: boolean;
  /** `[min, max]` in EUR, or empty for no price filter. */
  price: number[];
  customFields: Record<string, CustomFieldValue> | null | undefined;
}

/**
 * One filter dimension. Facet counts skip the dimension they count for, so
 * an option shows how many results it would add rather than dropping to 0
 * once a sibling option is chosen. Custom fields are addressed as `cf:<id>`.
 */
export type CatalogFilterDimension =
  | "cat"
  | "cities"
  | "distance"
  | "price"
  | `cf:${string}`;

export interface CatalogFilterOptions<T extends FilterableItem> {
  isEvent: boolean;
  /** The price the price filter compares; `null` counts as 0. */
  getMinPrice: (wrapper: T) => number | null | undefined;
  skip?: CatalogFilterDimension;
}

/**
 * Applies the catalog filters to a list of search results and returns the
 * whole list with the resulting match status: `match` for items that pass,
 * `too-far` for items outside the distance, `no-match` for the rest. Items
 * are never mutated; a status change yields a copy.
 */
export function applyCatalogFilters<T extends FilterableItem>(
  items: T[],
  criteria: CatalogFilterCriteria,
  options: CatalogFilterOptions<T>,
): T[] {
  const { isEvent, getMinPrice, skip } = options;
  let filtered: T[] = items;
  const tooFar = new Set<string>();

  if (!criteria.inclNoSuitable) {
    filtered = filtered.filter((b) => b.matchStatus !== MatchStatus.NO_MATCH);
  }

  if (isEvent && criteria.pubEv) {
    filtered = filtered.filter((e) => e.item.attendees?.publicEvent === true);
  }

  if (isEvent && criteria.regEv) {
    filtered = filtered.filter(
      (e) => e.item.attendees?.needsRegistration === true,
    );
  }

  if (criteria.customFields && typeof criteria.customFields === "object") {
    for (const [fieldId, filterValue] of Object.entries(
      criteria.customFields,
    )) {
      if (skip === `cf:${fieldId}`) continue;
      if (isEmptyFilterValue(filterValue)) continue;

      const def = getCustomFieldDef(items, fieldId);
      if (!def) continue;

      const filterType = def.usageOptions?.catalogFilterType;

      filtered = filtered.filter((b) => {
        const itemValue = getCustomFieldValue(b.item, fieldId);
        return matchesCustomField(itemValue, filterValue, filterType, def);
      });
    }
  }

  if (
    skip !== "cat" &&
    !isEvent &&
    Array.isArray(criteria.cat) &&
    criteria.cat.length > 0
  ) {
    filtered = filtered.filter(
      (b) => b.item.type != null && criteria.cat.includes(b.item.type),
    );
  }

  if (
    skip !== "cities" &&
    Array.isArray(criteria.cities) &&
    criteria.cities.length > 0
  ) {
    filtered = filtered.filter((b) => {
      const city = itemCity(b);
      if (!city) return false;
      return criteria.cities.some((c) =>
        city.toLowerCase().includes(c.toLowerCase()),
      );
    });
  }

  if (
    skip !== "distance" &&
    criteria.hasLocation &&
    criteria.distance !== null
  ) {
    const maxMeter = criteria.distance * 1000;
    filtered = filtered.flatMap((b) => {
      if (b.matchStatus === MatchStatus.NO_MATCH) return [];
      if (
        b.matchStatus === MatchStatus.MATCH &&
        (!b.item.location || b.item.distanceMeter === undefined)
      ) {
        return [b];
      }
      if (b.item.distanceMeter !== undefined && b.item.distanceMeter <= maxMeter) {
        return [
          b.matchStatus === MatchStatus.MATCH
            ? b
            : { ...b, matchStatus: MatchStatus.MATCH },
        ];
      }
      tooFar.add(b.item.id);
      return [];
    });
  }

  if (
    skip !== "price" &&
    Array.isArray(criteria.price) &&
    criteria.price.length === 2
  ) {
    const [minRaw, maxRaw] = criteria.price;
    const min = typeof minRaw === "number" ? minRaw : -Infinity;
    const max = typeof maxRaw === "number" ? maxRaw : Infinity;

    filtered = filtered.filter((b) => {
      const price = getMinPrice(b) ?? 0;
      return price >= (min === 0 ? -1 : min) && price <= max;
    });
  }

  const passing = new Map(filtered.map((f) => [f.item.id, f]));

  return items.map((i) => {
    const hit = passing.get(i.item.id);
    if (hit) return hit;

    const isTooFar =
      i.matchStatus === MatchStatus.TOO_FAR || tooFar.has(i.item.id);
    return {
      ...i,
      matchStatus: isTooFar ? MatchStatus.TOO_FAR : MatchStatus.NO_MATCH,
    };
  });
}

/** The city string the city filter matches against. */
export function itemCity(wrapper: FilterableItem) {
  const location = wrapper.item.location;
  if (!location) return "";
  return location.address?.city || location.display_address || "";
}

export function getCustomFieldDef(
  wrappers: FilterableItem[],
  fieldId: string,
) {
  for (const w of wrappers) {
    const def = w?.item?.customFields?.find((f) => f.id === fieldId);
    if (def) return def;
  }
  return null;
}

export function isEmptyFilterValue(v: unknown) {
  if (v == null) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (v === false) return true; // inactive checkbox
  return false;
}

export function matchesCustomField(
  itemValue: unknown,
  filterValue: unknown,
  filterType: string | undefined,
  filterDef: CustomFieldDefinition = { inputType: "" },
) {
  const itemValues = scalarCustomFieldValues(itemValue);
  if (itemValues.length === 0) {
    return false;
  }

  if (filterType === "select") {
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    if (filterDef.inputType === "numeric") {
      return filterValue.some((v) =>
        itemValues.some((iv) => Number(v) === iv),
      );
    }
    return filterValue.some((v) => itemValues.includes(v));
  }

  if (filterType === "checkbox") {
    if (filterValue !== true) return true;
    return itemValue === true || itemValue === "true";
  }

  if (filterType === "slider") {
    let n;
    if (filterDef && filterDef.inputType === "select") {
      const temp =
        filterDef.options?.findIndex((o) => o.value === itemValue) + 1;
      n = temp;
    } else {
      n = Number(itemValue);
    }

    if (Number.isNaN(n)) return false;
    return n <= Number(filterValue);
  }

  if (filterType === "range") {
    let n;
    if (filterDef && filterDef.inputType === "select") {
      n = filterDef.options?.findIndex((o) => o.value === itemValue) + 1;
    } else {
      n = Number(itemValue);
    }

    if (Number.isNaN(n)) return false;

    const [min, max] = filterValue as [number, number];
    return n >= min && n <= max;
  }

  return true;
}
