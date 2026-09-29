import { describe, expect, it } from "vitest";
import { computed, nextTick, ref } from "vue";

import {
  ALL_ITEMS,
  DEFAULT_PAGE_SIZE,
  useResultPagination,
} from "~/composables/search/useResultPagination.js";

function results(count, matchStatus = "match") {
  return Array.from({ length: count }, (_, i) => ({
    item: { id: `id-${i}` },
    matchStatus,
  }));
}

describe("the result pagination", () => {
  it("opens on the first page with twenty items", () => {
    const { page, pageSize, pagedItems, pageCount, total } =
      useResultPagination(computed(() => results(45)));

    expect(page.value).toBe(1);
    expect(pageSize.value).toBe(DEFAULT_PAGE_SIZE);
    expect(pagedItems.value).toHaveLength(20);
    expect(pagedItems.value[0].item.id).toBe("id-0");
    expect(pageCount.value).toBe(3);
    expect(total.value).toBe(45);
  });

  it("slices the page the reader is on, the last one short", () => {
    const { page, pagedItems, firstItemOnPage, lastItemOnPage } =
      useResultPagination(computed(() => results(45)));

    page.value = 3;

    expect(pagedItems.value).toHaveLength(5);
    expect(pagedItems.value[0].item.id).toBe("id-40");
    expect(firstItemOnPage.value).toBe(41);
    expect(lastItemOnPage.value).toBe(45);
  });

  it("puts everything on one page when the reader asks for all", () => {
    const { pageSize, pagedItems, pageCount, lastItemOnPage } =
      useResultPagination(computed(() => results(45)));

    pageSize.value = ALL_ITEMS;

    expect(pagedItems.value).toHaveLength(45);
    expect(pageCount.value).toBe(1);
    expect(lastItemOnPage.value).toBe(45);
  });

  it("pulls the reader back to the last page when a larger page size leaves it behind", async () => {
    const { page, pageSize, pageCount } = useResultPagination(
      computed(() => results(45)),
    );

    page.value = 3;
    pageSize.value = 100;
    await nextTick();

    expect(pageCount.value).toBe(1);
    expect(page.value).toBe(1);
  });

  it("returns to the first page when a new search replaces the results", async () => {
    const source = ref(results(45));
    const { page, pagedItems } = useResultPagination(source);

    page.value = 3;
    source.value = results(12);
    await nextTick();

    expect(page.value).toBe(1);
    expect(pagedItems.value).toHaveLength(12);
  });

  it("returns to the first page when a filter narrows the list the view derives", async () => {
    // The views hand in a computed built from their props, not a ref of their
    // own — a filter upstream has to reach the page number through it.
    const source = ref(results(45));
    const displayed = computed(() =>
      source.value.filter((b) => b.matchStatus === "match"),
    );
    const { page, total } = useResultPagination(displayed);

    page.value = 3;
    source.value = [...results(30, "match"), ...results(15, "too-far")];
    await nextTick();

    expect(page.value).toBe(1);
    expect(total.value).toBe(30);
  });

  it("counts nothing, and still offers one page, without results", () => {
    const { total, pageCount, pagedItems, firstItemOnPage, lastItemOnPage } =
      useResultPagination(computed(() => []));

    expect(total.value).toBe(0);
    expect(pageCount.value).toBe(1);
    expect(pagedItems.value).toEqual([]);
    expect(firstItemOnPage.value).toBe(0);
    expect(lastItemOnPage.value).toBe(0);
  });

  it("keeps the matching results ahead of the others across a page break", () => {
    const source = computed(() => [
      ...results(18, "match"),
      ...results(4, "too-far"),
    ]);
    const { page, pagedItems } = useResultPagination(source);

    expect(
      pagedItems.value.filter((b) => b.matchStatus === "match"),
    ).toHaveLength(18);
    expect(
      pagedItems.value.filter((b) => b.matchStatus !== "match"),
    ).toHaveLength(2);

    page.value = 2;
    expect(pagedItems.value).toHaveLength(2);
    expect(pagedItems.value.every((b) => b.matchStatus === "too-far")).toBe(
      true,
    );
  });
});
