import Fuse from "fuse.js";
import { useBookables } from "~/composables/api/useBookables";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState";
import type { CatalogQueryState, SortMode } from "~/types/catalogParams";
import haversine from "haversine-distance";

interface UseBookableSearchOptions<TItem> {
  sourceItems: ComputedRef<TItem[]> | Ref<TItem[]>;
  isEvent: boolean;
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

export function useBookableSearch<TItem extends { isBookable: boolean }>(
  options: UseBookableSearchOptions<TItem>,
) {
  const { sourceItems, isEvent } = options;

  const { state: query } = useCatalogQueryState();
  const searchIsInitialized = ref(false);
  const filterResetKey = ref(0);

  const updatedItems = ref<any[]>([]);

  const isMounted = ref(false);

  const bookableSearchTermOptions = {
    keys: ["item.title", "item.description", "item.flags", "item.tags"],
    includeScore: true,
    shouldSort: true,
    threshold: 0.3,
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
      "item.eventAddress.city",
      "item.eventAddress.zip",
      "item.eventAddress.street",
    ],
    includeScore: true,
    shouldSort: true,
    threshold: 0.2,
  };

  const filteredItems = computed(() => {
    let filtered = updatedItems.value;

    if (!query.inclNoSuitable) {
      filtered = filtered.filter((b) => b.status !== "nonSuitable");
    }
    if (isEvent && query.pubEv) {
      filtered = filtered.filter((e) => e.item.attendees.publicEvent === true);
    }

    if (isEvent && query.regEv) {
      filtered = filtered.filter(
        (e) => e.item.attendees.needsRegistration === true,
      );
    }

    if (!isEvent && Array.isArray(query.cat) && query.cat.length > 0) {
      filtered = filtered.filter((b) => query.cat.includes(b.item.type));
    }

    if (Array.isArray(query.cities) && query.cities.length > 0) {
      if (isEvent) {
        //toDo - adjust for new address object
        filtered = filtered.filter((b) => {
          if (!b.item.eventAddress.city) {
            return false;
          }
          return query.cities.some((city) => {
            return b.item.eventAddress.city
              .toLowerCase()
              .includes(city.toLowerCase());
          });
        });
      } else {
        filtered = filtered.filter((b) => {
          if (!b.item.location) return false;
          return query.cities.some((city) =>
            b.item.location.display_address
              .toLowerCase()
              .includes(city.toLowerCase()),
          );
        });
      }
    }

    const maxDistance = query.distance;
    if (typeof query.location === "object" && maxDistance !== null) {
      filtered = filtered.filter((b) => {
        if (!b.item.location || b.item.distanceMeter === undefined) {
          return false;
        }
        return b.item.distanceMeter <= maxDistance * 1000; // convert km to meters
      });
    }

    const priceRange = query.price;
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      const [minRaw, maxRaw] = priceRange;
      const min = typeof minRaw === "number" ? minRaw : -Infinity;
      const max = typeof maxRaw === "number" ? maxRaw : Infinity;

      filtered = filtered.filter((i) => {
        let price: number;
        if (isEvent) {
          price = getEventMinPrice(i) ?? 0;
        } else {
          price = getBookableMinPrice(i) ?? 0;
        }

        return price >= (min === 0 ? -1 : min) && price <= max;
      });
    }

    return filtered;
  });

  function getPrice(item: any) {
    if (item.calculatedPrice) {
      return item.calculatedPrice.userGrossPriceEur;
    }

    let minPrice: number;
    if (isEvent) {
      minPrice = getEventMinPrice(item) ?? 0;
    } else {
      minPrice = getBookableMinPrice(item) ?? 0;
    }

    return minPrice;
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
        const nameA = isEvent ? a.item.information.name : a.item.title;
        const nameB = isEvent ? b.item.information.name : b.item.title;
        return nameA.localeCompare(nameB);
      }
      if (query.sortMode === "alphabeticDescending") {
        const nameA = isEvent ? a.item.information.name : a.item.title;
        const nameB = isEvent ? b.item.information.name : b.item.title;
        return nameB.localeCompare(nameA);
      }

      //sort by distance to location (only if location is set as search criteria)
      if (
        query.sortMode === "distanceAscending"
      ) {
        const distanceA = a.item.distanceMeter ?? Infinity;
        const distanceB = b.item.distanceMeter ?? Infinity;

        return distanceA - distanceB;
      }
      if (
        query.sortMode === "distanceDescending"
      ) {
        const distanceA = a.item.distanceMeter ?? -Infinity;
        const distanceB = b.item.distanceMeter ?? -Infinity;

        return distanceB - distanceA;
      }
      return 0;
    });
  });

  function getBookableMinPrice(bookable: any) {
    if (bookable.status !== "suitable") return null;
    //got calculated price from search
    if (searchIsInitialized.value && bookable.calculatedPrice) {
      return bookable.calculatedPrice.userGrossPriceEur;
    }

    //all prices are free
    if (
      bookable.item.priceCategories.every(
        (c) => c.priceEur === 0 || c.priceEur === null,
      )
    ) {
      return -1;
    }

    //exclude holiday price categories
    const pricesWithoutHolidays = bookable.item.priceCategories.filter(
      (c) => c.holidays && c.holidays.length === 0,
    );

    const minPrice = Math.min(...pricesWithoutHolidays.map((c) => c.priceEur));
    return bookable.item.priceValueAddedTax
      ? minPrice + (minPrice * bookable.item.priceValueAddedTax) / 100
      : minPrice;
  }

  function getEventMinPrice(event: any) {
    if (event.status !== "suitable") {
      return null;
    }
    if (event.item.tickets && event.item.tickets.length > 0) {
      return Math.min(
        ...event.item.tickets.map((ticket: any) => getTicketMinPrice(ticket)),
      );
    } else {
      return 0;
    }
  }

  function getTicketMinPrice(ticket: any) {
    const minPrice = Math.min(
      ...ticket.priceCategories.map((cat: any) => cat.priceEur),
    );
    return ticket.priceValueAddedTax
      ? minPrice + (minPrice * ticket.priceValueAddedTax) / 100
      : minPrice;
  }

  const suitableCount = computed(
    () => sortedItems.value.filter((l) => l.status !== "nonSuitable").length,
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
    query.distance = criteria.distance ?? query.distance;
    query.price = criteria.price ?? query.price;
    query.start = criteria.start ?? query.start;
    query.end = criteria.end ?? query.end;
  }

  function setSortedQueryParams(sortMode: SortMode) {
    query.sortMode = sortMode;
  }

  function initializeResults() {
    if (!isEvent) {
      updatedItems.value = toValue(sourceItems).map((item: any) => {
        let isBookable = true;
        if (!item.isBookable) {
          isBookable = false;
        } else if (
          item.category === "event" &&
          item.attendees.publicEvent === false
        ) {
          isBookable = false;
        }
        return {
          item,
          status: isBookable ? "suitable" : "nonBookable",
          calculatedPrice: null,
        };
      });
    } else {
      updatedItems.value = toValue(sourceItems).map((item: any) => {
        if (item.attendees.publicEvent === true) {
          return { item: item, status: "suitable", calculatedPrice: null };
        }
        return { item: item, status: "nonBookable", calculatedPrice: null };
      });
    }
  }

  function setSearchQueryParams({
    term,
    location,
    distance,
    timeStart,
    timeEnd,
  }: {
    term?: string;
    location?: string | object;
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

  async function runSearch(criteria: {
    term: string;
    location: string | object;
    distance: number | null;
    timeStart: number | null;
    timeEnd: number | null;
  }) {
    setSearchQueryParams(criteria);

    //enrich items with status and location coordinates for the following search steps
    let enrichedItems: object[] = await enrichItems(
      () => toValue(sourceItems),
      criteria,
    );

    enrichedItems = await checkTickets(enrichedItems);

    let bookableItems: object[] = enrichedItems;

    bookableItems = searchForSearchTerm(criteria.term, bookableItems);

    bookableItems = await searchForLocation(
      criteria.location,
      bookableItems,
      criteria.distance,
    );

    bookableItems = await searchForTimePeriod(
      { start: criteria.timeStart, end: criteria.timeEnd },
      bookableItems,
    );

    updatedItems.value = await updateItemStatus(enrichedItems, bookableItems, {
      start: criteria.timeStart,
      end: criteria.timeEnd,
    });

    updatedItems.value = updateDistanceToLocation(
      updatedItems.value,
      criteria.location,
    );

    searchIsInitialized.value = true;
  }

  function resetResults() {
    setSearchQueryParams();
    initializeResults();
    searchIsInitialized.value = false;
    filterResetKey.value++;
  }

  async function enrichItems(
    itemsToSearch: () => any[],
    searchCriteria: object,
  ) {
    //add status to items based on bookable and event criteria
    let result: object[] = toValue(itemsToSearch).map((item: any) => {
      if (isEvent) {
        return { item, status: "isBookable" };
      }
      if (
        item.category === "event" ||
        (item.category !== "event" && item.isBookable)
      ) {
        return { item, status: "isBookable" };
      }
      return { item, status: "nonBookable" };
    });

    //add location coordinates to items based on address for better location search and distance calculation
    console.log("search criteria location:", searchCriteria.location);
    console.log(typeof searchCriteria.location);
    if (isEvent && typeof searchCriteria.location === "object") {
      result = await Promise.all(
        result.map(async (item) => {
          //if (isEvent) {
          let addressCoordinates: number[] = [];

          const addressString = `${item.item.eventAddress.street || ""} ${item.item.eventAddress.houseNumber || ""}, ${item.item.eventAddress.zip || ""} ${item.item.eventAddress.city || ""}`;

          if (addressString) {
            addressCoordinates = await searchAddress(addressString);
          }

          item = {
            ...item,
            item: {
              ...item.item,
              location: {
                display_address: addressString,
                coordinates: addressCoordinates
                  ? {
                      points: addressCoordinates,
                    }
                  : null,
              },
            },
          };
          return item;
          //}
        }),
      );
    }
    return result;
  }

  function searchForSearchTerm(searchTerm: string, items: object[]) {
    if (!searchTerm) return items;

    if (!isEvent) {
      const allEvents = items.filter((item) => item.item.category === "event");
      const allBookables = items.filter(
        (item) => item.item.category !== "event",
      );

      const foundEvents = new Fuse(allEvents, eventSearchTermOptions)
        .search(searchTerm)
        .map((result) => result.item);

      const foundBookables = new Fuse(allBookables, bookableSearchTermOptions)
        .search(searchTerm)
        .map((result) => result.item);

      return [...foundEvents, ...foundBookables];
    } else {
      return new Fuse(items, eventSearchTermOptions)
        .search(searchTerm)
        .map((result) => result.item);
    }
  }

  async function searchForLocation(
    searchLocation: string | object,
    items: object[],
    distance: number | null,
  ) {
    if (!searchLocation) return items;

    if (typeof searchLocation === "string") {
      return searchForLocationString(searchLocation, items);
    } else if (
      !searchLocation.coordinates ||
      !searchLocation.coordinates.points
    ) {
      return searchForLocationString(searchLocation.display_address, items);
    } else {
      const results: object[] = [];

      const itemsWithoutCoordinates: object[] = items.filter(
        (item) =>
          item.item.location ||
          !item.item.location.coordinates ||
          !item.item.location.coordinates.points[0] ||
          !item.item.location.coordinates.points[1],
      );

      const itemsWithCoordinates: object[] = items.filter(
        (item) =>
          item.item.location &&
          item.item.location.coordinates &&
          item.item.location.coordinates.points[0] &&
          item.item.location.coordinates.points[1],
      );

      // search for items without coordinates
      const searchString = searchLocation.display_address.split(",")[0] || "";
      searchForLocationString(searchString, itemsWithoutCoordinates).forEach(
        (r) => results.push(r),
      );

      // search for items with coordinates
      itemsWithCoordinates.forEach((i) => {
        const mDistance = getDistanceToLocation(
          searchLocation,
          i.item.location,
        );
        const kmDistance = mDistance ? mDistance / 1000 : null;

        if (distance && kmDistance && kmDistance <= distance) {
          results.push(i);
        }
      });

      return results;
    }
  }
  function searchForLocationString(searchLocation: string, items: any[]) {
    if (!isEvent) {
      const allEvents = items.filter((item) => item.item.category === "event");
      const allBookables = items.filter(
        (item) => item.item.category !== "event",
      );

      const foundEvents = new Fuse(allEvents, eventSearchLocationOptions)
        .search(searchLocation)
        .map((result) => result.item);

      const foundBookables = new Fuse(
        allBookables,
        bookableSearchLocationOptions,
      )
        .search(searchLocation)
        .map((result) => result.item);

      return [...foundEvents, ...foundBookables];
    } else {
      return new Fuse(items, eventSearchLocationOptions)
        .search(searchLocation)
        .map((result) => result.item);
    }
  }
  function getDistanceToLocation(searchLocation: any, itemLocation: any) {
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

  /*
  Performs the address search using Nominatim API, handling loading state and errors gracefully
   */
  async function searchAddress(address: string) {
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
        return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      }
    } catch (error) {
      console.error("Adress-Lookup fehlgeschlagen:", error);
    }
  }

  async function searchForTimePeriod(timePeriod: any, items: any[]) {
    if (timePeriod && timePeriod.start === null) {
      return items;
    }

    const checkAvailability = async (item: any) => {
      if (isEvent || item.item.category === "event") {
        const formattedEventTimePeriod = formateTimePeriod({
          startDate: item.item.information.startDate,
          startTime: item.item.information.startTime,
          endDate: item.item.information.endDate,
          endTime: item.item.information.endTime,
        });

        const isWithinPeriod =
          !!formattedEventTimePeriod &&
          timePeriod.start !== null &&
          timePeriod.end !== null &&
          formattedEventTimePeriod.start >= timePeriod.start &&
          formattedEventTimePeriod.end <= timePeriod.end;

        return {
          item,
          isAvailable: isWithinPeriod,
        };
      } else {
        const availability = options.getAvailability
          ? await options.getAvailability(
              item,
              timePeriod.start!,
              timePeriod.end!,
            )
          : await useBookables().getBookableAvailability(
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
    itemsWithStatus: any[],
    bookableItems: any[],
    timePeriod: any,
  ) {
    return await Promise.all(
      itemsWithStatus.map(async (item) => {
        const isSuitable = bookableItems.includes(item);
        if (item.status === "isBookable") {
          let price = null;
          if (
            timePeriod &&
            timePeriod.start !== null &&
            timePeriod.start !== null &&
            !isEvent &&
            item.item.category !== "event" //toDo - und oder oder???
          ) {
            try {
              price = options.getPriceForPeriod
                ? await options.getPriceForPeriod(
                    item.item,
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
            status: isSuitable ? "suitable" : "nonSuitable",
            calculatedPrice: isSuitable ? price : null,
          };
        } else {
          return {
            ...item,
            status: isSuitable ? "nonBookable" : "nonSuitable",
            calculatedPrice: null,
          };
        }
      }),
    );
  }

  function updateDistanceToLocation(items: any[], searchLocation: any) {
    if (
      !searchLocation ||
      !searchLocation.coordinates ||
      !searchLocation.coordinates.points ||
      searchLocation.coordinates.points.length !== 2
    ) {
      return items;
    }

    return items.map((item) => {
      if (
        typeof item.item.location === "string" ||
        !item.item.location.coordinates ||
        !item.item.location.coordinates.points ||
        item.item.location.coordinates.points[0] === null ||
        item.item.location.coordinates.points[1] === null
      ) {
        return item;
      }
      item.item["distanceMeter"] = getDistanceToLocation(
        item.item.location,
        searchLocation,
      );
      return item;
    });
  }

  function formateTimePeriod(timePeriod: {
    startDate: string | null;
    startTime: string | null;
    endTime: string | null;
    endDate: string | null;
  }) {
    if (timePeriod && timePeriod.startDate) {
      const newTimePeriod: { start: number; end: number | "" } = {
        start: 0,
        end: 0,
      };

      newTimePeriod.start = new Date(
        timePeriod.startDate + " " + timePeriod.startTime,
      ).getTime();

      newTimePeriod.end = "";
      if (!timePeriod.endDate && timePeriod.endTime) {
        newTimePeriod.end = new Date(
          timePeriod.startDate + " " + timePeriod.endTime,
        ).getTime();
      } else {
        newTimePeriod.end = new Date(
          timePeriod.endDate + " " + timePeriod.endTime,
        ).getTime();
      }
      return newTimePeriod;
    }
    return null;
  }

  async function checkTickets(events: { item: object; status: string }[]) {
    const result = await Promise.allSettled(
      events.map(async (event) => {
        if (
          //isEvent ||
          (event.item.category === "event" || event.item.type === "event") &&
          event.item.tickets &&
          event.item.tickets.length > 0
        ) {
          const updatedTickets = await Promise.all(
            event.item.tickets.map(async (ticket: any) => {
              const ticketPrice = await useBookables().getBookablePrice(
                event.item.tenantId,
                ticket.id,
              );
              const ticketAvailability =
                await useBookables().getBookableAvailability(
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

    return result.filter((r) => r.status === "fulfilled").map((r) => r.value);
  }

  const hasUrlCriteria = computed(() => {
    return (
      !!query.term ||
      !!query.location ||
      !!query.start ||
      !!query.end ||
      (Array.isArray(query.cat) && query.cat.length > 0) ||
      (Array.isArray(query.cities) && query.cities.length > 0) ||
      (Array.isArray(query.price) && query.price.length === 2)
    );
  });

  watch(
    () => toValue(sourceItems),
    (val) => {
      if (!val || val.length === 0) {
        updatedItems.value = [];
        return;
      }

      const hasStatus = updatedItems.value.some((b) => b?.status);
      if (hasStatus) return;

      initializeResults();
    },
    { immediate: true, deep: true },
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
    runSearch,
    resetResults,
    isMounted,
  };
}
