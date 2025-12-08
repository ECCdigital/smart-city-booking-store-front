import Fuse from "fuse.js";
import { useBookables } from "~/composables/api/useBookables";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState";
import type { CatalogQueryState, SortMode } from "~/types/catalogParams";

interface UseBookableSearchOptions<TItem> {
  sourceItems: ComputedRef<TItem[]> | Ref<TItem[]>;
  isEvent: boolean;
  getAvailability?: (
    item: TItem,
    start: number,
    end: number
  ) => Promise<{ isAvailable: boolean; remaining: number }>;
  getPriceForPeriod?: (
    item: TItem,
    start: number,
    end: number
  ) => Promise<{ userGrossPriceEur: number } | null>;
}

export function useBookableSearch<TItem extends { isBookable: boolean }>(
  options: UseBookableSearchOptions<TItem>
) {
  const { sourceItems, isEvent } = options;

  const { state: query } = useCatalogQueryState();
  const searchIsInitialized = ref(false);
  const filterResetKey = ref(0);

  const updatedItems = ref<any[]>([]);

  const bookableSearchTermOptions = {
    keys: ["item.title", "item.description", "item.flags", "item.tags"],
    includeScore: true,
    shouldSort: true,
    threshold: 0.3,
  };

  const bookableSearchLocationOptions = {
    keys: ["item.description", "item.location"],
    includeScore: true,
    shouldSort: true,
    threshold: 0.3,
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
    threshold: 0.3,
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
        (e) => e.item.attendees.needsRegistration === true
      );
    }

    if (Array.isArray(query.cities) && query.cities.length > 0) {
      if (isEvent) {
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
            b.item.location.toLowerCase().includes(city.toLowerCase())
          );
        });
      }
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

        return price >= min && price <= max;
      });
    }

    return filtered;
  });

  function getPrice(item: any) {
    if (item.calculatedPrice) {
      return item.calculatedPrice.userGrossPriceEur;
    }
    const minPrice = Math.min(
      ...(item.item?.priceCategories?.map((cat: any) => cat.priceEur) || [])
    );
    return item.item.priceValueAddedTax
      ? minPrice + (minPrice * item.item.priceValueAddedTax) / 100
      : minPrice;
  }

  const sortedItems = computed(() => {
    return filteredItems.value.slice().sort((a, b) => {
      if (query.sortMode === "priceAscending") {
        return getPrice(a) - getPrice(b);
      }
      if (query.sortMode === "priceDescending") {
        return getPrice(b) - getPrice(a);
      }
      return 0;
    });
  });

  function getBookableMinPrice(bookable: any) {
    if (bookable.status !== "suitable") return null;
    if (searchIsInitialized.value && bookable.calculatedPrice) {
      return bookable.calculatedPrice.userGrossPriceEur;
    }
    const minPrice = Math.min(
      ...(bookable.item?.priceCategories?.map((cat: any) => cat.priceEur) || [])
    );
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
        ...event.item.tickets.map((ticket: any) => getTicketMinPrice(ticket))
      );
    } else {
      return 0;
    }
  }

  function getTicketMinPrice(ticket: any) {
    const minPrice = Math.min(
      ...ticket.priceCategories.map((cat: any) => cat.priceEur)
    );
    return ticket.priceValueAddedTax
      ? minPrice + (minPrice * ticket.priceValueAddedTax) / 100
      : minPrice;
  }

  const suitableCount = computed(
    () => sortedItems.value.filter((l) => l.status === "suitable").length
  );

  function setFilterQueryParams(criteria: Partial<CatalogQueryState>) {
    query.inclNoSuitable =
      typeof criteria.inclNoSuitable === "boolean"
        ? criteria.inclNoSuitable
        : query.inclNoSuitable;
    query.pubEv = criteria.pubEv ?? query.pubEv;
    query.regEv = criteria.regEv ?? query.regEv;
    query.cities = criteria.cities ?? query.cities;
    query.price = criteria.price ?? query.price;
    query.start = criteria.start ?? query.start;
    query.end = criteria.end ?? query.end;
  }

  function setSortedQueryParams(sortMode: SortMode) {
    query.sortMode = sortMode;
  }

  function initializeResults() {
    if (!isEvent) {
      updatedItems.value = toValue(sourceItems).map((item: any) => ({
        item,
        status: item.isBookable ? "suitable" : "nonBookable",
        calculatedPrice: null,
      }));
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
    timeStart,
    timeEnd,
  }: {
    term?: string;
    location?: string;
    timeStart?: number | null;
    timeEnd?: number | null;
  } = {}) {
    query.term = term || "";
    query.location = location || "";
    query.start = timeStart || null;
    query.end = timeEnd || null;
  }

  async function runSearch(criteria: {
    term: string;
    location: string;
    timeStart: number | null;
    timeEnd: number | null;
  }) {
    setSearchQueryParams(criteria);

    let itemsWithStatus = setItemStatus(() => toValue(sourceItems));

    if (isEvent) {
      itemsWithStatus = await checkTickets(itemsWithStatus);
    }

    let bookableItems = itemsWithStatus.filter(
      (i: any) => i.status === "isBookable"
    );

    bookableItems = searchForSearchTerm(criteria.term, bookableItems);
    bookableItems = searchForLocation(criteria.location, bookableItems);
    bookableItems = await searchForTimePeriod(
      { start: criteria.timeStart, end: criteria.timeEnd },
      bookableItems
    );

    updatedItems.value = await updateItemStatus(
      itemsWithStatus,
      bookableItems,
      { start: criteria.timeStart, end: criteria.timeEnd }
    );

    searchIsInitialized.value = true;
  }

  function resetResults() {
    setSearchQueryParams();
    initializeResults();
    searchIsInitialized.value = false;
    filterResetKey.value++;
  }

  function setItemStatus(itemsToSearch: () => any[]) {
    return toValue(itemsToSearch).map((item: any) => {
      if (!isEvent && item.isBookable) {
        return { item: item, status: "isBookable" };
      } else if (isEvent) {
        return { item: item, status: "isBookable" };
      } else {
        return { item: item, status: "nonBookable" };
      }
    });
  }

  function searchForSearchTerm(searchTerm: string, items: any[]) {
    if (searchTerm && !isEvent) {
      items = new Fuse(items, bookableSearchTermOptions)
        .search(searchTerm)
        .map((result) => result.item);
    } else if (searchTerm && isEvent) {
      items = new Fuse(items, eventSearchTermOptions)
        .search(searchTerm)
        .map((result) => result.item);
    }
    return items;
  }

  function searchForLocation(searchLocation: string, items: any[]) {
    if (searchLocation && !isEvent) {
      items = new Fuse(items, bookableSearchLocationOptions)
        .search(searchLocation)
        .map((result) => result.item);
    } else if (searchLocation && isEvent) {
      items = new Fuse(items, eventSearchLocationOptions)
        .search(searchLocation)
        .map((result) => result.item);
    }
    return items;
  }

  async function searchForTimePeriod(timePeriod: any, items: any[]) {
    if (timePeriod && timePeriod.start !== null) {
      let availabilityChecks: any[] = [];
      if (!isEvent) {
        availabilityChecks = await Promise.all(
          items.map(async (item) => {
            const availability = options.getAvailability
              ? await options.getAvailability(
                  item.item,
                  timePeriod.start,
                  timePeriod.end
                )
              : await useBookables().getBookableAvailability(
                  item.item.tenantId,
                  item.item.id,
                  timePeriod.start,
                  timePeriod.end
                );
            return {
              item,
              isAvailable:
                availability.isAvailable && availability.remaining > 0,
            };
          })
        );
      } else if (isEvent) {
        availabilityChecks = items.map((item) => {
          const formattedEventTimePeriod = formateTimePeriod({
            startDate: item.item.information.startDate,
            startTime: item.item.information.startTime,
            endDate: item.item.information.endDate,
            endTime: item.item.information.endTime,
          });

          const isWithinPeriod =
            formattedEventTimePeriod &&
            timePeriod &&
            formattedEventTimePeriod.start >= timePeriod.start &&
            formattedEventTimePeriod.end <= timePeriod.end;

          return {
            item,
            isAvailable: isWithinPeriod,
          };
        });
      }
      items = availabilityChecks
        .filter((result) => result.isAvailable)
        .map((result) => result.item);
    }
    return items;
  }

  async function updateItemStatus(
    itemsWithStatus: any[],
    bookableItems: any[],
    timePeriod: any
  ) {
    return await Promise.all(
      itemsWithStatus.map(async (item) => {
        if (item.status === "isBookable") {
          const isSuitable = bookableItems.includes(item);

          let price = null;
          if (
            timePeriod &&
            timePeriod.start !== null &&
            timePeriod.start !== null &&
            !isEvent
          ) {
            price = options.getPriceForPeriod
              ? await options.getPriceForPeriod(
                  item.item,
                  timePeriod.start,
                  timePeriod.end
                )
              : await useBookables().getBookablePrice(
                  item.item.tenantId,
                  item.item.id,
                  timePeriod.start,
                  timePeriod.end
                );
          } else if (timePeriod && isEvent) {
            //check price and availability for events
            //toDo - needed??
          }
          return {
            ...item,
            status: isSuitable ? "suitable" : "nonSuitable",
            calculatedPrice: isSuitable ? price : null,
          };
        } else {
          return {
            ...item,
            status: "nonBookable",
            calculatedPrice: null,
          };
        }
      })
    );
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
        timePeriod.startDate + " " + timePeriod.startTime
      ).getTime();

      newTimePeriod.end = "";
      if (!timePeriod.endDate && timePeriod.endTime) {
        newTimePeriod.end = new Date(
          timePeriod.startDate + " " + timePeriod.endTime
        ).getTime();
      } else {
        newTimePeriod.end = new Date(
          timePeriod.endDate + " " + timePeriod.endTime
        ).getTime();
      }
      return newTimePeriod;
    }
    return null;
  }

  async function checkTickets(events: { item: any; status: string }[]) {
    return await Promise.all(
      events.map(async (event) => {
        const updatedTickets = await Promise.all(
          event.item.tickets.map(async (ticket: any) => {
            const ticketPrice = await useBookables().getBookablePrice(
              event.item.tenantId,
              ticket.id
            );
            const ticketAvailability =
              await useBookables().getBookableAvailability(
                event.item.tenantId,
                ticket.id
              );
            return {
              ...ticket,
              calculatedPrice: ticketPrice,
              availability: ticketAvailability,
            };
          })
        );
        return {
          ...event,
          item: {
            ...event.item,
            tickets: updatedTickets,
          },
        };
      })
    );
  }

  const hasUrlCriteria = computed(() => {
    return (
      !!query.term ||
      !!query.location ||
      !!query.start ||
      !!query.end ||
      (Array.isArray(query.cities) && query.cities.length > 0) ||
      (Array.isArray(query.price) && query.price.length === 2)
    );
  });

  watch(
    () => toValue(sourceItems),
    async (val) => {
      if (!val || val.length === 0) {
        updatedItems.value = [];
        return;
      }

      const hasStatus = updatedItems.value.some((b) => b?.status);
      if (hasStatus) return;

      if (hasUrlCriteria.value) {
        searchIsInitialized.value = true;
        await runSearch({
          term: query.term,
          location: query.location,
          timeStart: query.start,
          timeEnd: query.end,
        });
      } else {
        initializeResults();
      }
    },
    { immediate: true, deep: true }
  );

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
  };
}
