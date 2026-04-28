import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "#imports";
import type { CatalogQueryState } from "~/types/catalogParams";

function parseNumberOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const CF_PREFIX = "cf_";

function parseCustomFieldValue(raw: string): any {
  if (raw === "true") return true;
  if (raw === "false") return false;

  if (raw.includes(",")) {
    const parts = raw.split(",").map((p) => Number(p));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      return parts as [number, number];
    }
  }

  if (raw.includes("|")) {
    return raw.split("|").map((v) => decodeURIComponent(v));
  }

  const n = Number(raw);
  if (Number.isFinite(n) && raw.trim() !== "") return n;

  return decodeURIComponent(raw);
}

function serializeCustomFieldValue(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length === 2 && value.every((v) => typeof v === "number")) {
      return `${value[0]},${value[1]}`;
    }
    return value.map((v) => encodeURIComponent(String(v))).join("|");
  }

  if (typeof value === "string") {
    if (value === "") return null;
    return encodeURIComponent(value);
  }

  return null;
}

function isFilterValueSet(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (v === false) return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function useCatalogQueryState() {
  const route = useRoute();
  const router = useRouter();

  const state = useState<CatalogQueryState>("catalog-query-state", () => {
    const initialCustomFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(route.query)) {
      if (!key.startsWith(CF_PREFIX) || typeof value !== "string") continue;
      const fieldId = key.slice(CF_PREFIX.length);
      initialCustomFields[fieldId] = parseCustomFieldValue(value);
    }

    return {
      term: decodeURIComponent((route.query.q as string) || ""),
      location: decodeURIComponent((route.query.loc as string) || ""),
      distance: parseNumberOrNull(route.query.dist),
      start: parseNumberOrNull(route.query.start),
      end: parseNumberOrNull(route.query.end),

      inclNoSuitable: route.query.inclNoSuitable !== "false",
      pubEv: route.query.pubEv === "true",
      regEv: route.query.regEv === "true",

      cat: route.query.cat
          ? (route.query.cat as string)
              .split(",")
              .map((c) => decodeURIComponent(c.toLowerCase()))
          : [],

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

      sortMode: (route.query.sort as any) || "alphabeticAscending",

      customFields: initialCustomFields,
    };
  });

  const initialCustomFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(route.query)) {
    if (!key.startsWith(CF_PREFIX) || typeof value !== "string") continue;
    const fieldId = key.slice(CF_PREFIX.length);
    initialCustomFields[fieldId] = parseCustomFieldValue(value);
  }

  const queryObject = computed(() => {
    const q: Record<string, string> = {};
    const s = state.value;

    if (s.term) q.q = encodeURIComponent(s.term);
    if (s.location) q.loc = encodeURIComponent(s.location);
    if (s.distance != null) q.dist = String(s.distance);
    if (s.start != null) q.start = String(s.start);
    if (s.end != null) q.end = String(s.end);

    if (!s.inclNoSuitable) q.inclNoSuitable = "false";
    if (s.pubEv) q.pubEv = "true";
    if (s.regEv) q.regEv = "true";

    if (s.cat.length > 0) {
      q.cat = s.cat.map((c) => encodeURIComponent(c)).join(",");
    }

    if (s.cities.length > 0) {
      q.cities = s.cities.map((c) => encodeURIComponent(c)).join(",");
    }

    if (s.price.length > 0) {
      q.price = `${s.price[0]},${s.price[1]}`;
    }

    if (s.sortMode !== "alphabeticAscending") {
      q.sort = s.sortMode;
    }

    if (s.customFields) {
      for (const [fieldId, value] of Object.entries(s.customFields)) {
        const serialized = serializeCustomFieldValue(value);
        if (serialized !== null) {
          q[`${CF_PREFIX}${fieldId}`] = serialized;
        }
      }
    }

    return q;
  });

  watch(
      queryObject,
      (q) => {
        router.replace({ query: q });
      },
      { deep: true },
  );

  const isFilterActive = computed(() => {
    const s = state.value;
    if (s.inclNoSuitable === false) return true;
    if (s.pubEv) return true;
    if (s.regEv) return true;
    if (s.cat.length > 0) return true;
    if (s.cities.length > 0) return true;
    if (s.distance != null) return true;
    if (s.price.length === 2) return true;

    if (s.customFields) {
      for (const v of Object.values(s.customFields)) {
        if (isFilterValueSet(v)) return true;
      }
    }
    return false;
  });


  const isSearchActive = computed(() => {
    const s = state.value;
    return !!s.term || !!s.location || s.start != null || s.end != null;
  });

  return {
    state: state.value,
    queryObject,
    isFilterActive,
    isSearchActive,
  };
}