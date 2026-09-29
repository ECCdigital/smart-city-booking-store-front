import Fuse from "fuse.js";
import { useBookables } from "~/composables/api/useBookables";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState";
import {
  eventOverlapsPeriod,
  fromPriceOf,
  isBookableOffer,
  isEventItem,
  titleOf,
  type OfferItem,
} from "~/composables/search/offer";
import type {
  CatalogQueryState,
  SortMode,
  TimePeriod,
  ViewMode,
} from "~/types/catalogParams";
import haversine from "haversine-distance";
import {
  applyCatalogFilters,
  MatchStatus,
  type CustomFieldDefinition,
} from "~/composables/search/catalogFilters";

/** A place the search can measure a distance from or to. */
interface SearchLocation {
  display_address?: string;
  coordinates?: { points?: [number, number] };
}

/** What the search reads off an Offer, bookable or event. */
export type SearchableItem = OfferItem & {
  customFields?: CustomFieldDefinition[];
};

/** A source item as the search wraps it, with what it worked out about it. */
export interface SearchResultItem {
  item: SearchableItem;
  isBookable: boolean;
  matchStatus: string;
  calculatedPrice?: { userGrossPriceEur: number } | null;
}

interface UseBookableSearchOptions<TItem> {
  sourceItems: ComputedRef<TItem[]> | Ref<TItem[]> | TItem[];
  getAvailability?: (
    item: TItem,
    start: number,
    end: number,
  ) => Promise<{ isAvailable: boolean; remaining: number }>;
  getPriceForPeriod?: (
    item: TItem,
    start: number,
    end: number,
  ) => Promise<{ userGrossPriceEur: number } | null>;
}

/**
 * What the geocoder answered per address, so a search, its re-runs on a
 * reloaded bundle and the map's centring ask Nominatim once per address. An
 * address it could not place is remembered as null; a failed request is not.
 */
const resolvedAddresses = new Map<string, [number, number] | null>();

export async function searchAddress(address: string) {
  const key = address.trim().toLowerCase();
  if (resolvedAddresses.has(key)) {
    return resolvedAddresses.get(key) ?? undefined;
  }

  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      addressdetails: "1",
      limit: "1", //"5"
      countrycodes: "de",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "Accept-Language": "de",
        },
      },
    );

    const data = await response.json();
    if (data && data.length > 0) {
      const points: [number, number] = [
        parseFloat(data[0].lon),
        parseFloat(data[0].lat),
      ];
      resolvedAddresses.set(key, points);
      return points;
    }
    resolvedAddresses.set(key, null);
  } catch (error) {
    console.error("Adress-Lookup fehlgeschlagen:", error);
  }
}

const DEFAULT_DISTANCE_KM = 20;

/**
 * A location that arrives as text, as it does from the URL, becomes a place
 * with coordinates when the geocoder knows it; the search then measures
 * distances exactly as for a place picked in the search bar. Text the
 * geocoder cannot place stays text and is matched against the addresses.
 */
async function resolveLocation(
  location: string | SearchLocation,
): Promise<string | SearchLocation> {
  if (typeof location !== "string" || !location.trim()) return location;

  const points = await searchAddress(location);
  if (!points) return location;

  return { display_address: location, coordinates: { points } };
}

/**
 * Searches, filters and sorts one list of Offers, bookables and events
 * together. Every step reads the item's Kind (`type === "event"`) where the two
 * differ; nothing here assumes the whole list is one Kind.
 */
export function useBookableSearch<TItem extends SearchableItem>(
  options: UseBookableSearchOptions<TItem>,
) {
  const { sourceItems } = options;

  const {
    state: query,
    isFilterActive,
    isSearchActive,
  } = useCatalogQueryState();
  const searchIsInitialized = ref(false);
  const filterResetKey = ref(0);

  const updatedItems = ref<SearchResultItem[]>([]);

  const isMounted = ref(false);

  const bookableSearchTermOptions = {
    keys: ["item.title", "item.description", "item.flags", "item.tags"],
    includeScore: true,
    shouldSort: true,
    distance: 150,
    threshold: 0.25,
  };

  const bookableSearchLocationOptions = {
    keys: ["item.description", "item.location.display_address"],
    includeScore: true,
    shouldSort: true,
    threshold: 0.2,
  };

  const eventSearchTermOptions = {
    keys: [
      "item.information.name",
      "item.information.description",
      "item.information.teaserText",
      "item.information.flags",
      "item.information.tags",
      "item.eventOrganizer.name",
    ],
    includeScore: true,
    shouldSort: true,
    threshold: 0.3,
  };
  const eventSearchLocationOptions = {
    keys: [
      "item.information.description",
      "item.eventLocation.name",
      "item.location.display_address",
      "item.location.address.city",
      "item.location.address.post_code",
      "item.location.address.street",
    ],
    includeScore: true,
    shouldSort: true,
    threshold: 0.2,
  };

  const filteredItems = computed(() =>
    applyCatalogFilters(
      updatedItems.value,
      {
        inclNoSuitable: query.inclNoSuitable,
        pubEv: query.pubEv,
        regEv: query.regEv,
        cat: query.cat,
        cities: query.cities,
        tenants: query.tenants,
        distance: query.distance,
        hasLocation: !!query.location,
        price: query.price,
        customFields: query.customFields,
      },
      { getMinPrice },
    ),
  );

  function getPrice(item: SearchResultItem) {
    if (item.calculatedPrice) {
      return item.calculatedPrice.userGrossPriceEur;
    }
    return getMinPrice(item) ?? 0;
  }

  const sortedItems = computed(() => {
    return filteredItems.value.slice().sort((a, b) => {
      //sort by price
      if (query.sortMode === "priceAscending") {
        return getPrice(a) - getPrice(b);
      }
      if (query.sortMode === "priceDescending") {
        return getPrice(b) - getPrice(a);
      }

      //sort by alphabetic order of name/title
      if (query.sortMode === "alphabeticAscending") {
        return titleOf(a.item).localeCompare(titleOf(b.item));
      }
      if (query.sortMode === "alphabeticDescending") {
        return titleOf(b.item).localeCompare(titleOf(a.item));
      }

      //sort by distance to location (only if location is set as search criteria)
      if (query.sortMode === "distanceAscending") {
        const distanceA = a.item.distanceMeter ?? Infinity;
        const distanceB = b.item.distanceMeter ?? Infinity;

        return distanceA - distanceB;
      }
      if (query.sortMode === "distanceDescending") {
        const distanceA = a.item.distanceMeter ?? -Infinity;
        const distanceB = b.item.distanceMeter ?? -Infinity;

        return distanceB - distanceA;
      }
      return 0;
    });
  });

  /**
   * The price the list shows and sorts by: the calculated one once a period
   * has been searched, otherwise the Offer's "from" price. A non-matching
   * Offer has no price. Every free Offer is -1 so it sorts ahead of the paid
   * ones and survives a price filter whose lower bound is 0.
   */
  function getMinPrice(wrapper: SearchResultItem) {
    if (wrapper.matchStatus !== MatchStatus.MATCH) return null;
    if (searchIsInitialized.value && wrapper.calculatedPrice) {
      return wrapper.calculatedPrice.userGrossPriceEur;
    }
    const price = fromPriceOf(wrapper.item);
    if (price === null) return null;
    return price === 0 ? -1 : price;
  }

  const suitableCount = computed(
    () =>
      sortedItems.value.filter((l) => l.matchStatus === MatchStatus.MATCH)
        .length,
  );

  function setFilterQueryParams(criteria: Partial<CatalogQueryState>) {
    query.inclNoSuitable =
      typeof criteria.inclNoSuitable === "boolean"
        ? criteria.inclNoSuitable
        : query.inclNoSuitable;
    query.pubEv = criteria.pubEv ?? query.pubEv;
    query.regEv = criteria.regEv ?? query.regEv;
    query.cat = criteria.cat ?? query.cat;
    query.cities = criteria.cities ?? query.cities;
    query.tenants = criteria.tenants ?? query.tenants;
    query.distance = query.location
      ? (criteria.distance ?? query.distance)
      : null;
    query.price = criteria.price ?? query.price;
    query.start = criteria.start ?? query.start;
    query.end = criteria.end ?? query.end;

    query.customFields = criteria.customFields ?? query.customFields;
  }

  function setSortedQueryParams(sortMode: SortMode) {
    query.sortMode = sortMode;
  }

  function setViewQueryParams(viewMode: ViewMode) {
    query.viewMode = viewMode;
  }

  function initializeResults() {
    updatedItems.value = toValue(sourceItems).map((item) => ({
      item,
      isBookable: isBookableOffer(item),
      matchStatus: MatchStatus.MATCH,
      calculatedPrice: null,
    }));
  }

  function setSearchQueryParams({
    term,
    location,
    distance,
    timeStart,
    timeEnd,
  }: {
    term?: string;
    location?: string | SearchLocation;
    distance?: number | null;
    timeStart?: number | null;
    timeEnd?: number | null;
  } = {}) {
    query.term = term || "";

    if (typeof location === "object") {
      query.location = location.display_address || "";
    } else {
      query.location = location || "";
    }

    query.distance = distance || null;
    query.start = timeStart || null;
    query.end = timeEnd || null;
  }

  /**
   * Whether this search needs the ticket API at all. Pricing and checking
   * every ticket of every event costs two requests per ticket; a plain
   * keyword or location search shows the list price instead and only a
   * period, a price sort or a price filter earns the calls.
   */
  function needsTicketPricing(criteria: {
    timeStart: number | null;
    timeEnd: number | null;
  }) {
    const hasPeriod = criteria.timeStart !== null && criteria.timeEnd !== null;
    const priceSort =
      query.sortMode === "priceAscending" ||
      query.sortMode === "priceDescending";
    const priceFilter = Array.isArray(query.price) && query.price.length === 2;
    return hasPeriod || priceSort || priceFilter;
  }

  async function runSearch(criteria: {
    term: string;
    location: string | SearchLocation;
    distance: number | null;
    timeStart: number | null;
    timeEnd: number | null;
  }) {
    setSearchQueryParams(criteria);

    // The URL carries the place as text; the search wants coordinates.
    const location = await resolveLocation(criteria.location);
    const distance =
      typeof location === "object" && location.coordinates
        ? (criteria.distance ?? DEFAULT_DISTANCE_KM)
        : criteria.distance;

    //enrich items with status and location coordinates for the following search steps
    let enrichedItems: SearchResultItem[] = enrichItems(() =>
      toValue(sourceItems),
    );

    if (needsTicketPricing(criteria)) {
      enrichedItems = await checkTickets(enrichedItems);
    }

    let bookableItems: SearchResultItem[] = enrichedItems;

    bookableItems = searchForSearchTerm(criteria.term, bookableItems);

    bookableItems = await searchForTimePeriod(
      { start: criteria.timeStart, end: criteria.timeEnd },
      bookableItems,
    );

    bookableItems = await searchForLocation(location, bookableItems, distance);

    updatedItems.value = await updateItemStatus(enrichedItems, bookableItems, {
      start: criteria.timeStart,
      end: criteria.timeEnd,
    });

    updatedItems.value = updateDistanceToLocation(updatedItems.value, location);

    searchIsInitialized.value = true;
  }

  function resetResults() {
    setSearchQueryParams();
    initializeResults();
    searchIsInitialized.value = false;
    filterResetKey.value++;
  }

  function enrichItems(itemsToSearch: () => SearchableItem[]) {
    //add status to items based on bookable and event criteria
    const result: SearchResultItem[] = toValue(itemsToSearch).map((item) => ({
      item,
      isBookable: isBookableOffer(item),
      matchStatus: MatchStatus.MATCH,
    }));

    return result;
  }

  /** Two indexes, one per Kind: the fields worth searching differ. */
  function fuseBoth(
    items: SearchResultItem[],
    needle: string,
    eventOptions: object,
    bookableOptions: object,
  ) {
    const events = items.filter((i) => isEventItem(i.item));
    const bookables = items.filter((i) => !isEventItem(i.item));

    const foundEvents = new Fuse(events, eventOptions)
      .search(needle)
      .map((result) => result.item);

    const foundBookables = new Fuse(bookables, bookableOptions)
      .search(needle)
      .map((result) => result.item);

    return [...foundEvents, ...foundBookables];
  }

  function searchForSearchTerm(searchTerm: string, items: SearchResultItem[]) {
    if (!searchTerm) return items;
    return fuseBoth(
      items,
      searchTerm,
      eventSearchTermOptions,
      bookableSearchTermOptions,
    );
  }

  async function searchForLocation(
    searchLocation: string | SearchLocation,
    items: SearchResultItem[],
    distance: number | null,
  ) {
    if (
      !searchLocation ||
      (typeof searchLocation === "object" && !searchLocation.display_address)
    ) {
      return items;
    }

    if (typeof searchLocation === "string") {
      items = removeDistanceToLocation(items);
      return searchForLocationString(searchLocation, items);
    } else if (
      !searchLocation.coordinates ||
      !searchLocation.coordinates.points
    ) {
      items = removeDistanceToLocation(items);
      return searchForLocationString(
        searchLocation.display_address ?? "",
        items,
      );
    } else {
      const results: SearchResultItem[] = [];

      const itemsWithoutCoordinates = items.filter(
        (item) => !hasCoordinates(item.item),
      );
      const itemsWithCoordinates = items.filter((item) =>
        hasCoordinates(item.item),
      );

      // search for items without coordinates: a geocoder address loses its
      // trailing country, a bare place name is searched as it is
      const addressParts = (searchLocation.display_address ?? "").split(",");
      const searchString = (
        addressParts.length > 1
          ? addressParts.slice(0, -1).join(",")
          : addressParts[0]
      ).trim();

      searchForLocationString(searchString, itemsWithoutCoordinates).forEach(
        (r) => results.push(r),
      );

      // search for items with coordinates
      itemsWithCoordinates.forEach((i) => {
        const mDistance = getDistanceToLocation(
          searchLocation,
          i.item.location as SearchLocation,
        );
        const kmDistance =
          mDistance === 0 ? 0 : mDistance ? mDistance / 1000 : null;

        if (kmDistance === 0) {
          results.push(i);
        } else if (distance && kmDistance && kmDistance <= distance) {
          results.push(i);
        } else if (distance && kmDistance && kmDistance > distance) {
          i.matchStatus = MatchStatus.TOO_FAR;
        }
      });

      return results;
    }
  }
  function searchForLocationString(
    searchLocation: string,
    items: SearchResultItem[],
  ) {
    return fuseBoth(
      items,
      searchLocation,
      eventSearchLocationOptions,
      bookableSearchLocationOptions,
    );
  }

  function hasCoordinates(item: SearchableItem) {
    const location = item.location;
    if (!location || typeof location === "string") return false;
    const points = location.coordinates?.points;
    return !!points && points[0] != null && points[1] != null;
  }

  function getDistanceToLocation(
    searchLocation: SearchLocation | null,
    itemLocation: SearchLocation | null,
  ) {
    if (
      !searchLocation ||
      !searchLocation.coordinates ||
      !searchLocation.coordinates.points ||
      !itemLocation ||
      !itemLocation.coordinates ||
      !itemLocation.coordinates.points
    )
      return null;

    return haversine(
      searchLocation.coordinates.points,
      itemLocation.coordinates.points,
    );
  }

  async function searchForTimePeriod(
    timePeriod: TimePeriod | null,
    items: SearchResultItem[],
  ) {
    if (!timePeriod || timePeriod.start === null) {
      return items;
    }

    const checkAvailability = async (item: SearchResultItem) => {
      if (isEventItem(item.item)) {
        // An event is on during the period when it overlaps it; it does not
        // have to fit inside a two-hour room search.
        return {
          item,
          isAvailable: eventOverlapsPeriod(item.item, timePeriod),
        };
      } else {
        const availability = options.getAvailability
          ? await options.getAvailability(
              item.item as TItem,
              timePeriod.start!,
              timePeriod.end!,
            )
          : await useBookables().getBookableOccupancy(
              item.item.tenantId,
              item.item.id,
              timePeriod.start!,
              timePeriod.end!,
            );

        return {
          item,
          isAvailable: availability.isAvailable,
        };
      }
    };

    const availabilityChecks = await Promise.all(items.map(checkAvailability));
    return availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.item);
  }

  async function updateItemStatus(
    itemsWithStatus: SearchResultItem[],
    bookableItems: SearchResultItem[],
    timePeriod: TimePeriod | null,
  ) {
    const temp = await Promise.all(
      itemsWithStatus.map(async (item) => {
        const isSuitable = bookableItems.some(
          (b) => b.item.id === item.item.id,
        );

        if (item.matchStatus === MatchStatus.TOO_FAR) {
          return {
            ...item,
            isBookable: item.isBookable,
            matchStatus: isSuitable ? MatchStatus.MATCH : MatchStatus.TOO_FAR,
            calculatedPrice: null,
          };
        } else {
          let price = null;
          if (
            item.isBookable &&
            timePeriod &&
            timePeriod.start !== null &&
            timePeriod.end !== null &&
            !isEventItem(item.item)
          ) {
            try {
              price = options.getPriceForPeriod
                ? await options.getPriceForPeriod(
                    item.item as TItem,
                    timePeriod.start,
                    timePeriod.end,
                  )
                : await useBookables().getBookablePrice(
                    item.item.tenantId,
                    item.item.id,
                    timePeriod.start,
                    timePeriod.end,
                  );
            } catch {
              price = null;
            }
          }

          return {
            ...item,
            isBookable: item.isBookable,
            matchStatus: isSuitable ? MatchStatus.MATCH : MatchStatus.NO_MATCH,
            calculatedPrice: isSuitable ? price : null,
          };
        }
      }),
    );

    return temp;
  }

  function removeDistanceToLocation(items: SearchResultItem[]) {
    return items.map((item) => {
      if (item.item.distanceMeter) {
        item.item.distanceMeter = undefined;
        return item;
      }
      return item;
    });
  }
  function updateDistanceToLocation(
    items: SearchResultItem[],
    searchLocation: string | SearchLocation | null,
  ) {
    if (
      !searchLocation ||
      typeof searchLocation === "string" ||
      !searchLocation.coordinates ||
      !searchLocation.coordinates.points ||
      searchLocation.coordinates.points.length !== 2
    ) {
      return items;
    }

    return items.map((item) => {
      if (!hasCoordinates(item.item)) {
        return item;
      }
      item.item.distanceMeter =
        getDistanceToLocation(
          item.item.location as SearchLocation,
          searchLocation,
        ) ?? undefined;
      return item;
    });
  }

  async function checkTickets(events: SearchResultItem[]) {
    const result = await Promise.allSettled(
      events.map(async (event) => {
        if (
          isEventItem(event.item) &&
          event.item.tickets &&
          event.item.tickets.length > 0
        ) {
          const updatedTickets = await Promise.all(
            event.item.tickets.map(async (ticket) => {
              const ticketPrice = await useBookables().getBookablePrice(
                event.item.tenantId,
                ticket.id,
              );
              const ticketAvailability =
                await useBookables().getBookableOccupancy(
                  event.item.tenantId,
                  ticket.id,
                );
              return {
                ...ticket,
                calculatedPrice: ticketPrice,
                availability: ticketAvailability,
              };
            }),
          );
          return {
            ...event,
            item: {
              ...event.item,
              tickets: updatedTickets,
            },
          };
        } else {
          return event;
        }
      }),
    );
    return result.map((r, index) =>
      r.status === "fulfilled" ? r.value : events[index],
    );
  }

  const hasUrlCriteria = computed(
    () => isSearchActive.value || isFilterActive.value,
  );

  function getSourceItemIds(items: unknown[] | null | undefined) {
    if (!Array.isArray(items)) return "";
    return items
      .map((item: { id?: string }) => item?.id ?? "")
      .filter(Boolean)
      .sort()
      .join(",");
  }

  watch(
    () => toValue(sourceItems),
    async (val, oldVal) => {
      if (!val || val.length === 0) {
        updatedItems.value = [];
        return;
      }

      const newIds = getSourceItemIds(val);
      const oldIds = getSourceItemIds(oldVal);
      if (newIds === oldIds && updatedItems.value.length > 0) {
        return;
      }

      if (searchIsInitialized.value && isMounted.value) {
        await runSearch({
          term: query.term,
          location: query.location,
          distance: query.distance,
          timeStart: query.start,
          timeEnd: query.end,
        });
        return;
      }

      initializeResults();
    },
    { immediate: true },
  );

  onMounted(async () => {
    isMounted.value = true;

    if (hasUrlCriteria.value && toValue(sourceItems).length > 0) {
      searchIsInitialized.value = true;
      await runSearch({
        term: query.term,
        location: query.location,
        distance: query.distance,
        timeStart: query.start,
        timeEnd: query.end,
      });
    }
  });

  return {
    query,
    searchIsInitialized,
    filterResetKey,
    updatedItems,
    filteredItems,
    sortedItems,
    suitableCount,
    setFilterQueryParams,
    setSortedQueryParams,
    setViewQueryParams,
    runSearch,
    resetResults,
    searchAddress,
    isMounted,
  };
}
