import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { usePortalStore } from "~~/stores/portal.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import { sendRedirect } from "h3";

function buildBundleKey({ slug, tenantID, bookableID, eventID, include, base }) {
  const sortedInclude = Array.isArray(include)
    ? [...include].sort().join(",")
    : include ?? "";
  return [
    "catalog-bundle",
    slug ?? "root",
    tenantID ?? "all",
    bookableID ?? "-",
    eventID ?? "-",
    sortedInclude,
    base === false ? "items" : "base",
  ].join(":");
}

function buildContextKey(slug, tenantID) {
  return [slug ?? "root", tenantID ?? "all"].join(":");
}

export function useCatalogBundle() {
  const { fetchCatalogBundle } = useCatalog();
  const catalogStore = useCatalogStore();
  const bookableStore = useBookableStore();
  const eventStore = useEventStore();
  const tenantStore = useTenantStore();
  const portalStore = usePortalStore();
  const { tenantID } = useTenant();

  async function loadBundle({
    slug = null,
    bookableID = null,
    eventID = null,
    include = [],
  } = {}) {
    const contextKey = buildContextKey(slug, tenantID.value);
    const includeList = Array.isArray(include) ? include : [include];
    const baseKnown =
      catalogStore.loadedFor === contextKey &&
      tenantStore.loadedFor === contextKey &&
      portalStore.loadedFor === contextKey;
    const effectiveInclude = includeList
      .filter(Boolean)
      .filter((entry) => {
        if (entry === "bookables") {
          return bookableStore.loadedFor !== contextKey;
        }
        if (entry === "events") {
          return eventStore.loadedFor !== contextKey;
        }
        return true;
      });
    const bookableKnown =
      bookableID &&
      bookableStore.getBookableById(bookableID) &&
      (bookableStore.loadedFor === contextKey ||
        bookableStore.loadedDetailsFor[contextKey]?.includes(bookableID));
    const eventKnown =
      eventID &&
      eventStore.getEventById(eventID) &&
      (eventStore.loadedFor === contextKey ||
        eventStore.loadedDetailsFor[contextKey]?.includes(eventID));
    const effectiveBookableID =
      bookableID && !bookableKnown ? bookableID : null;
    const effectiveEventID = eventID && !eventKnown ? eventID : null;

    if (
      baseKnown &&
      effectiveInclude.length === 0 &&
      !effectiveBookableID &&
      !effectiveEventID
    ) {
      if (portalStore.isPersonalMode) {
        const event = import.meta.server ? useRequestEvent() : null;
        if (import.meta.server && event) {
          return await sendRedirect(event, `/account`, 302);
        }
        return navigateTo(`/account`);
      }

      return {
        branding: portalStore.branding,
        portalUrl: portalStore.portalUrl,
        catalog: catalogStore.catalog,
        tenants: tenantStore.tenants,
        bookables: bookableStore.loadedFor === contextKey
          ? bookableStore.bookables
          : undefined,
        events: eventStore.loadedFor === contextKey
          ? eventStore.events
          : undefined,
      };
    }

    const cacheKey = buildBundleKey({
      slug,
      tenantID: tenantID.value,
      bookableID: effectiveBookableID,
      eventID: effectiveEventID,
      include: effectiveInclude,
      base: !baseKnown,
    });

    const event = import.meta.server ? useRequestEvent() : null;

    const { data, error } = await useAsyncData(
      cacheKey,
      () =>
        fetchCatalogBundle({
          slug,
          tenantID: tenantID.value,
          bookableID: effectiveBookableID,
          eventID: effectiveEventID,
          include: effectiveInclude.join(","),
          base: !baseKnown,
          catalogType: catalogStore.catalog?.type ?? null,
          catalogTenantID: catalogStore.catalog?.tenantId ?? null,
          tenantIDs: tenantStore.tenants.map((tenant) => tenant.id),
        }),
      {
        server: true,
        dedupe: "defer",
        getCachedData: (key, nuxtApp) =>
          nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
      }
    );

    if (error.value) {
      if (error.value.statusMessage === "unauthorized") {
        if (import.meta.server && event) {
          return await sendRedirect(event, `/login`, 302);
        }
        return navigateTo(`/login`);
      }
      throw error.value;
    }

    if (data.value?.branding) {
      portalStore.$patch({
        branding: data.value.branding,
        portalUrl: data.value.portalUrl ?? null,
        loadedFor: contextKey,
      });
    }

    if (data.value?.offersEnabled === false) {
      portalStore.$patch({ mode: "personal", loadedFor: contextKey });
      if (import.meta.server && event) {
        return await sendRedirect(event, `/account`, 302);
      }
      return navigateTo(`/account`);
    }

    if (data.value?.offersEnabled === true) {
      portalStore.$patch({ mode: "offers", loadedFor: contextKey });
    }

    if (data.value?.catalog) {
      catalogStore.$patch({
        catalog: data.value.catalog,
        loadedFor: contextKey,
      });
    }
    if (data.value?.bookables) {
      bookableStore.$patch({
        bookables: data.value.bookables,
        loadedFor: contextKey,
        initialized: true,
      });
    }
    if (data.value?.bookable) {
      bookableStore.addOrUpdate(data.value.bookable);
      bookableStore.$patch((state) => {
        const details = state.loadedDetailsFor[contextKey] ?? [];
        const id = data.value.bookable.id ?? effectiveBookableID;
        state.loadedDetailsFor[contextKey] = [
          ...new Set([...details, id].filter(Boolean)),
        ];
      });
    }
    if (data.value?.events) {
      const eventsWithType = data.value.events.map((evt) => ({
        ...evt,
        type: "event",
      }));
      eventStore.$patch({
        events: eventsWithType,
        loadedFor: contextKey,
        initialized: true,
      });
    }
    if (data.value?.event) {
      eventStore.addOrUpdate(data.value.event);
      eventStore.$patch((state) => {
        const details = state.loadedDetailsFor[contextKey] ?? [];
        const id = data.value.event.id ?? effectiveEventID;
        state.loadedDetailsFor[contextKey] = [
          ...new Set([...details, id].filter(Boolean)),
        ];
      });
    }
    if (data.value?.tenants) {
      tenantStore.$patch({
        tenants: data.value.tenants,
        loadedFor: contextKey,
        initialized: true,
      });
    }

    return data.value;
  }

  function clearBundleCache({
    slug = null,
    bookableID = null,
    eventID = null,
    include = [],
  } = {}) {
    const cacheKey = buildBundleKey({
      slug,
      tenantID: tenantID.value,
      bookableID,
      eventID,
      include,
      base: true,
    });
    clearNuxtData(cacheKey);
  }

  return { loadBundle, clearBundleCache };
}
