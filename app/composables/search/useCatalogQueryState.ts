import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "#imports";
import type { CatalogQueryState } from "~/types/catalogParams";

function parseNumberOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function useCatalogQueryState() {
  const route = useRoute();
  const router = useRouter();

  const state = reactive<CatalogQueryState>({
    term: decodeURIComponent((route.query.q as string) || ""),
    location: decodeURIComponent((route.query.loc as string) || ""),
    start: parseNumberOrNull(route.query.start),
    end: parseNumberOrNull(route.query.end),

    inclNoSuitable: route.query.inclNoSuitable !== "false",
    pubEv: route.query.pubEv === "true",
    regEv: route.query.regEv === "true",
    cities: route.query.cities
      ? (route.query.cities as string)
          .split(",")
          .map((c) => decodeURIComponent(c.toLowerCase()))
      : [],

    price: route.query.price
      ? (() => {
          const [min, max] = (route.query.price as string)
            .split(",")
            .map((p) => Number(p));
          return [min, max] as [number, number];
        })()
      : [],

    sortMode: (route.query.sort as any) || "relevance",
  });

  const queryObject = computed(() => {
    const q: Record<string, string> = {};

    if (state.term) q.q = encodeURIComponent(state.term);
    if (state.location) q.loc = encodeURIComponent(state.location);
    if (state.start != null) q.start = String(state.start);
    if (state.end != null) q.end = String(state.end);

    if (!state.inclNoSuitable) q.inclNoSuitable = "false";
    if (state.pubEv) q.pubEv = "true";
    if (state.regEv) q.regEv = "true";

    if (state.cities.length > 0) {
      q.cities = state.cities.map((c) => encodeURIComponent(c)).join(",");
    }

    if (state.price.length > 0) {
      q.price = `${state.price[0]},${state.price[1]}`;
    }

    if (state.sortMode !== "relevance") {
      q.sort = state.sortMode;
    }

    return q;
  });

  watch(
    queryObject,
    (q) => {
      router.replace({ query: q });
    },
    { deep: true }
  );

  return {
    state,
    queryObject,
  };
}
