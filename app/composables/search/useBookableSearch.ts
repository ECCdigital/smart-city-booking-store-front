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
      (c) => c.holidays.length === 0,
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
    () => sortedItems.value.filter((l) => l.status === "suitable").length,
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

    itemsWithStatus = await checkTickets(itemsWithStatus);

    let bookableItems = itemsWithStatus.filter(
      (i: any) => i.status === "isBookable",
    );

    bookableItems = searchForSearchTerm(criteria.term, bookableItems);
    bookableItems = searchForLocation(criteria.location, bookableItems);
    bookableItems = await searchForTimePeriod(
      { start: criteria.timeStart, end: criteria.timeEnd },
      bookableItems,
    );

    updatedItems.value = await updateItemStatus(
      itemsWithStatus,
      bookableItems,
      { start: criteria.timeStart, end: criteria.timeEnd },
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
  }

  function searchForSearchTerm(searchTerm: string, items: any[]) {
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

  function searchForLocation(searchLocation: string, items: any[]) {
    if (!searchLocation) return items;

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
        if (item.status === "isBookable") {
          const isSuitable = bookableItems.includes(item);

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
            status: "nonBookable",
            calculatedPrice: null,
          };
        }
      }),
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

  async function checkTickets(events: { item: any; status: string }[]) {
    return await Promise.all(
      events.map(async (event) => {
        if (isEvent || event.item.category === "event") {
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
