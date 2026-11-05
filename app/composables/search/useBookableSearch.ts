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
import {
  createRequestCache,
  idsToCheck,
  mapWithConcurrency,
  narrowingKey,
  periodBatches,
  PERIOD_CHECK_CONCURRENCY,
  type NarrowingCriteria,
} from "~/composables/search/periodChecks";

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

  // Availability, price and ticket answers per Offer and period, so a re-run
  // asks the backend only for what it has not answered yet.
  const cached = createRequestCache();
  // Only the latest run may write its results; an older one still waiting
  // for the backend is dropped.
  let latestRun = 0;

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

  function narrowingCriteria(): NarrowingCriteria {
    return {
      pubEv: query.pubEv,
      regEv: query.regEv,
      cat: query.cat,
      cities: query.cities,
      tenants: query.tenants,
      customFields: query.customFields,
    };
  }

  function setFilterQueryParams(criteria: Partial<CatalogQueryState>) {
    const keyBefore = narrowingKey(narrowingCriteria());

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

    // The search only asked about the Offers the old filters kept. Widened or
    // moved, the newly shown ones need their check; cached answers are reused.
    if (
      searchIsInitialized.value &&
      needsTicketPricing({ timeStart: query.start, timeEnd: query.end }) &&
      narrowingKey(narrowingCriteria()) !== keyBefore
    ) {
      void runSearch(currentQueryCriteria());
    }
  }

  function currentQueryCriteria() {
    return {
      term: query.term,
      location: query.location,
      distance: query.distance,
      timeStart: query.start,
      timeEnd: query.end,
    };
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
    const run = ++latestRun;
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

    // The cheap steps first: term and place narrow the list without a request.
    let bookableItems: SearchResultItem[] = searchForSearchTerm(
      criteria.term,
      enrichedItems,
    );
    bookableItems = await searchForLocation(location, bookableItems, distance);

    // Only the Offers the active filters keep cost requests; the others are
    // hidden anyway and are checked once a filter shows them.
    const checkIds = idsToCheck(bookableItems, narrowingCriteria());

    if (needsTicketPricing(criteria)) {
      const withTickets = new Map(
        (
          await checkTickets(
            bookableItems.filter((i) => checkIds.has(i.item.id)),
          )
        ).map((i) => [i.item.id, i]),
      );
      const replace = (i: SearchResultItem) => withTickets.get(i.item.id) ?? i;
      enrichedItems = enrichedItems.map(replace);
      bookableItems = bookableItems.map(replace);
    }

    const period = { start: criteria.timeStart, end: criteria.timeEnd };
    bookableItems = await searchForTimePeriod(period, bookableItems, checkIds);

    const items = await updateItemStatus(
      enrichedItems,
      bookableItems,
      period,
      checkIds,
    );

    if (run !== latestRun) return;

    updatedItems.value = updateDistanceToLocation(items, location);

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

  function periodKey(
    kind: string,
    item: { id: string; tenantId?: string },
    start: number,
    end: number,
  ) {
    return `${kind}|${item.tenantId}|${item.id}|${start}|${end}`;
  }

  /**
   * Asks the backend for occupancy and price of the bookables to check, one
   * request per tenant, and keeps the answers for
   * the single checks that follow. A bookable the backend leaves out is out
   * of reach and not available; a failed request leaves its bookables to
   * the single requests.
   */
  async function prefetchPeriod(
    items: SearchResultItem[],
    start: number,
    end: number,
  ) {
    if (options.getAvailability || options.getPriceForPeriod) return;

    const toAsk = items
      .filter((i) => i.isBookable && !isEventItem(i.item))
      .map((i) => ({ id: i.item.id, tenantId: i.item.tenantId as string }))
      .filter((item) => !cached.has(periodKey("occupancy", item, start, end)));

    await mapWithConcurrency(
      periodBatches(toAsk),
      PERIOD_CHECK_CONCURRENCY,
      async ({ tenantId, ids }) => {
        const answers: {
          bookableId: string;
          isAvailable: boolean;
          price?: { userGrossPriceEur: number } | null;
        }[] = await useBookables().getPeriodOccupancies(
          tenantId,
          ids,
          start,
          end,
        );
        const byId = new Map(answers.map((a) => [a.bookableId, a]));

        for (const id of ids) {
          const item = { id, tenantId };
          const answer = byId.get(id) ?? { isAvailable: false, price: null };
          void cached(periodKey("occupancy", item, start, end), async () => answer);
          if (answer.price) {
            const price = answer.price;
            void cached(periodKey("price", item, start, end), async () => price);
          }
        }
      },
    );
  }

  function fetchAvailability(item: SearchableItem, start: number, end: number) {
    return cached(periodKey("occupancy", item, start, end), () =>
      options.getAvailability
        ? options.getAvailability(item as TItem, start, end)
        : useBookables().getBookableOccupancy(
            item.tenantId,
            item.id,
            start,
            end,
          ),
    );
  }

  function fetchPrice(item: SearchableItem, start: number, end: number) {
    return cached(periodKey("price", item, start, end), async () => {
      const price = options.getPriceForPeriod
        ? await options.getPriceForPeriod(item as TItem, start, end)
        : await useBookables().getBookablePrice(
            item.tenantId,
            item.id,
            start,
            end,
          );
      // No price is how a failed request answers; it must not be cached.
      if (!price) throw new Error("No price for period");
      return price;
    });
  }

  /**
   * Keeps the Offers that can be had in the period. Only the ones in
   * `checkIds` are asked about; the rest pass unchecked, the filters hide
   * them. An Offer whose check fails stays in the list: one refused request
   * must not empty a search, and the checkout checks again.
   */
  async function searchForTimePeriod(
    timePeriod: TimePeriod | null,
    items: SearchResultItem[],
    checkIds: Set<string>,
  ) {
    if (!timePeriod || timePeriod.start === null || timePeriod.end === null) {
      return items;
    }
    const start = timePeriod.start;
    const end = timePeriod.end;

    await prefetchPeriod(
      items.filter((i) => checkIds.has(i.item.id)),
      start,
      end,
    );

    const availability = await mapWithConcurrency(
      items,
      PERIOD_CHECK_CONCURRENCY,
      async (item) => {
        if (!checkIds.has(item.item.id)) return true;
        if (isEventItem(item.item)) {
          // An event is on during the period when it overlaps it; it does not
          // have to fit inside a two-hour room search.
          return eventOverlapsPeriod(item.item, timePeriod);
        }
        // An Offer that cannot be booked at all is not available in any
        // period; the backend would say the same.
        if (!item.isBookable) return false;

        return (await fetchAvailability(item.item, start, end)).isAvailable;
      },
    );

    return items.filter((_, index) => availability[index] !== false);
  }

  /**
   * Sets each Offer's match status and, for a bookable that matched a period
   * and was checked, the price of that period. Prices are fetched only for
   * those, with the same limit on requests in flight.
   */
  async function updateItemStatus(
    itemsWithStatus: SearchResultItem[],
    bookableItems: SearchResultItem[],
    timePeriod: TimePeriod | null,
    checkIds: Set<string>,
  ) {
    const suitableIds = new Set(bookableItems.map((b) => b.item.id));
    const start = timePeriod?.start ?? null;
    const end = timePeriod?.end ?? null;

    const prices = await mapWithConcurrency(
      itemsWithStatus,
      PERIOD_CHECK_CONCURRENCY,
      async (item) => {
        if (
          start === null ||
          end === null ||
          item.matchStatus === MatchStatus.TOO_FAR ||
          !item.isBookable ||
          isEventItem(item.item) ||
          !suitableIds.has(item.item.id) ||
          !checkIds.has(item.item.id)
        ) {
          return null;
        }
        return fetchPrice(item.item, start, end);
      },
    );

    return itemsWithStatus.map((item, index) => {
      const isSuitable = suitableIds.has(item.item.id);

      if (item.matchStatus === MatchStatus.TOO_FAR) {
        return {
          ...item,
          matchStatus: isSuitable ? MatchStatus.MATCH : MatchStatus.TOO_FAR,
          calculatedPrice: null,
        };
      }

      return {
        ...item,
        matchStatus: isSuitable ? MatchStatus.MATCH : MatchStatus.NO_MATCH,
        calculatedPrice: isSuitable ? (prices[index] ?? null) : null,
      };
    });
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

  /**
   * Prices and checks every ticket of the given events, a few requests at a
   * time. An event whose ticket requests fail keeps its tickets as they were.
   */
  async function checkTickets(events: SearchResultItem[]) {
    const withTickets = events.filter(
      (event) =>
        isEventItem(event.item) &&
        event.item.tickets &&
        event.item.tickets.length > 0,
    );

    const updated = await mapWithConcurrency(
      withTickets,
      PERIOD_CHECK_CONCURRENCY,
      async (event) => {
        const { tenantId } = event.item;
        const tickets = [];
        for (const ticket of event.item.tickets ?? []) {
          const [calculatedPrice, availability] = await Promise.all([
            cached(`ticket-price|${tenantId}|${ticket.id}`, async () => {
              const price = await useBookables().getBookablePrice(
                tenantId,
                ticket.id,
              );
              // No price is how a failed request answers; not cached.
              if (!price) throw new Error("No ticket price");
              return price;
            }).catch(() => null),
            cached(`ticket-occupancy|${tenantId}|${ticket.id}`, () =>
              useBookables().getBookableOccupancy(tenantId, ticket.id),
            ),
          ]);
          tickets.push({ ...ticket, calculatedPrice, availability });
        }
        return { ...event, item: { ...event.item, tickets } };
      },
    );

    const byId = new Map(
      withTickets.map((event, index) => [
        event.item.id,
        updated[index] ?? event,
      ]),
    );
    return events.map((event) => byId.get(event.item.id) ?? event);
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
