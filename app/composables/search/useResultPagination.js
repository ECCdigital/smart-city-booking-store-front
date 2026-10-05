import { computed, ref, toValue, watch } from "vue";

/**
 * The page size the result views open with, and the sentinel that stands for
 * "show everything" in the per-page select.
 */
export const DEFAULT_PAGE_SIZE = 20;
export const ALL_ITEMS = -1;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, ALL_ITEMS];

/**
 * Paginates an already ordered list of search results.
 *
 * The caller passes the sequence exactly as it is rendered — matching results
 * first, the non-matching ones behind them — so a page is a plain slice of it
 * and the counter never disagrees with what is on screen.
 *
 * @param {import('vue').MaybeRefOrGetter<Array>} items the full, ordered result list
 * @param {{ scrollTarget?: import('vue').Ref<HTMLElement | null> }} [options]
 *   the element to bring back into view after a page turn
 */
export function useResultPagination(items, { scrollTarget } = {}) {
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);

  const total = computed(() => toValue(items).length);

  // "All" is one page holding everything; a size of at least 1 keeps the page
  // count finite while the result list is still empty.
  const itemsPerPage = computed(() =>
    pageSize.value === ALL_ITEMS ? Math.max(total.value, 1) : pageSize.value,
  );

  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / itemsPerPage.value)),
  );

  // A new search, filter or sort order gives a different list: the reader
  // expects to be back at its beginning.
  watch(
    () => toValue(items),
    () => {
      page.value = 1;
    },
  );

  // Raising the page size can leave the current page behind the end.
  watch(pageCount, (count) => {
    if (page.value > count) page.value = count;
  });

  // Turning the page from the control at the bottom would otherwise leave the
  // reader looking at the end of the new page.
  watch(page, () => {
    if (!import.meta.client) return;
    scrollTarget?.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const pagedItems = computed(() => {
    const start = (page.value - 1) * itemsPerPage.value;
    return toValue(items).slice(start, start + itemsPerPage.value);
  });

  const firstItemOnPage = computed(() =>
    total.value === 0 ? 0 : (page.value - 1) * itemsPerPage.value + 1,
  );

  const lastItemOnPage = computed(() =>
    Math.min(page.value * itemsPerPage.value, total.value),
  );

  return {
    page,
    pageSize,
    itemsPerPage,
    pageCount,
    total,
    pagedItems,
    firstItemOnPage,
    lastItemOnPage,
  };
}
