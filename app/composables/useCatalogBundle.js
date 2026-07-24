import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { usePortalStore } from "~~/stores/portal.js";
import { useAuthStore } from "~~/stores/auth.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import { sendRedirect } from "h3";

function getAuthScope() {
  const authStore = useAuthStore();
  return authStore.isLoggedIn ? "auth" : "anon";
}

function buildBundleKey({
  slug,
  tenantID,
  bookableID,
  eventID,
  include,
  base,
  authScope,
}) {
  const sortedInclude = Array.isArray(include)
    ? [...include].sort().join(",")
    : include ?? "";
  return [
    "catalog-bundle",
    authScope ?? "anon",
    slug ?? "root",
    tenantID ?? "all",
    bookableID ?? "-",
    eventID ?? "-",
    sortedInclude,
    base === false ? "items" : "base",
  ].join(":");
}

function buildContextKey(slug, tenantID, authScope) {
  return [slug ?? "root", tenantID ?? "all", authScope ?? "anon"].join(":");
}

export function useCatalogBundle() {
  const { fetchCatalogBundle } = useCatalog();
  const catalogStore = useCatalogStore();
  const bookableStore = useBookableStore();
  const eventStore = useEventStore();
  const tenantStore = useTenantStore();
  const portalStore = usePortalStore();
  const { tenantID } = useTenant();

  function applyBundleResponse(
    data,
    contextKey,
    { effectiveBookableID = null, effectiveEventID = null } = {},
  ) {
    if (data?.branding) {
      portalStore.$patch({
        branding: data.branding,
        portalUrl: data.portalUrl ?? null,
        loadedFor: contextKey,
      });
    }

    if (data?.offersEnabled === false) {
      portalStore.$patch({ mode: "personal", loadedFor: contextKey });
    } else if (data?.offersEnabled === true) {
      portalStore.$patch({ mode: "offers", loadedFor: contextKey });
    }

    if (data?.catalog) {
      catalogStore.$patch({
        catalog: data.catalog,
        loadedFor: contextKey,
      });
    }
    if (data?.bookables) {
      bookableStore.$patch({
        bookables: data.bookables,
        loadedFor: contextKey,
        initialized: true,
      });
    }
    if (data?.bookable) {
      bookableStore.addOrUpdate(data.bookable);
      bookableStore.$patch((state) => {
        const details = state.loadedDetailsFor[contextKey] ?? [];
        const id = data.bookable.id ?? effectiveBookableID;
        state.loadedDetailsFor[contextKey] = [
          ...new Set([...details, id].filter(Boolean)),
        ];
      });
    }
    if (data?.events) {
      const eventsWithType = data.events.map((evt) => ({
        ...evt,
        type: "event",
      }));
      eventStore.$patch({
        events: eventsWithType,
        loadedFor: contextKey,
        initialized: true,
      });
    }
    if (data?.event) {
      eventStore.addOrUpdate(data.event);
      eventStore.$patch((state) => {
        const details = state.loadedDetailsFor[contextKey] ?? [];
        const id = data.event.id ?? effectiveEventID;
        state.loadedDetailsFor[contextKey] = [
          ...new Set([...details, id].filter(Boolean)),
        ];
      });
    }
    if (data?.tenants) {
      tenantStore.$patch({
        tenants: data.tenants,
        loadedFor: contextKey,
        initialized: true,
      });
    }
  }

  function isDetailLoadedForCurrentAuth({
    slug = null,
    bookableID = null,
    eventID = null,
  } = {}) {
    const contextKey = buildContextKey(slug, tenantID.value, getAuthScope());
    const detailId = bookableID ?? eventID;
    if (!detailId) return false;

    const detailsForScope = bookableID
      ? bookableStore.loadedDetailsFor[contextKey]
      : eventStore.loadedDetailsFor[contextKey];

    return detailsForScope?.includes(detailId) ?? false;
  }

  function invalidateBundle() {
    bookableStore.$patch({
      bookables: [],
      loadedFor: null,
      loadedDetailsFor: {},
      initialized: false,
    });
    eventStore.$patch({
      events: [],
      loadedFor: null,
      loadedDetailsFor: {},
      initialized: false,
    });
    catalogStore.$patch({ loadedFor: null });
    tenantStore.$patch({ loadedFor: null, initialized: false });
    portalStore.$patch({ loadedFor: null });

    clearNuxtData(
      (key) =>
        typeof key === "string" &&
        (key.startsWith("catalog-bundle:") || key === "catalog-bundle-home"),
    );
  }

  async function loadDetail({
    slug = null,
    bookableID = null,
    eventID = null,
    force = false,
  } = {}) {
    if (!bookableID && !eventID) {
      throw new Error("loadDetail requires bookableID or eventID");
    }

    const authScope = getAuthScope();
    const contextKey = buildContextKey(slug, tenantID.value, authScope);
    const detailId = bookableID ?? eventID;

    if (
      !force &&
      isDetailLoadedForCurrentAuth({ slug, bookableID, eventID })
    ) {
      return bookableID
        ? bookableStore.getBookableById(bookableID)
        : eventStore.getEventById(eventID);
    }

    const canSkipBase = Boolean(
      catalogStore.catalog?.type &&
        (catalogStore.catalog?.tenantId || tenantStore.tenants.length > 0),
    );

    const data = await fetchCatalogBundle({
      slug,
      tenantID: tenantID.value,
      bookableID: bookableID || undefined,
      eventID: eventID || undefined,
      include: undefined,
      base: canSkipBase ? false : undefined,
      catalogType: catalogStore.catalog?.type ?? null,
      catalogTenantID: catalogStore.catalog?.tenantId ?? null,
      tenantIDs: tenantStore.tenants.map((tenant) => tenant.id),
    });

    if (data?.offersEnabled === false) {
      portalStore.$patch({ mode: "personal", loadedFor: contextKey });
      if (import.meta.client) {
        await navigateTo("/account");
      }
      return data;
    }

    applyBundleResponse(data, contextKey, {
      effectiveBookableID: bookableID,
      effectiveEventID: eventID,
    });

    return bookableID
      ? bookableStore.getBookableById(detailId)
      : eventStore.getEventById(detailId);
  }

  async function loadBundle({
    slug = null,
    bookableID = null,
    eventID = null,
    include = [],
    force = false,
  } = {}) {
    const includeList = Array.isArray(include) ? include : [include];
    const hasOnlyDetailRequest =
      (bookableID || eventID) && includeList.filter(Boolean).length === 0;

    if (hasOnlyDetailRequest) {
      return loadDetail({ slug, bookableID, eventID, force });
    }

    const authScope = getAuthScope();
    const contextKey = buildContextKey(slug, tenantID.value, authScope);
    const baseKnown =
      !force &&
      catalogStore.loadedFor === contextKey &&
      tenantStore.loadedFor === contextKey &&
      portalStore.loadedFor === contextKey;
    const effectiveInclude = includeList.filter(Boolean).filter((entry) => {
      if (force) return true;
      if (entry === "bookables") {
        return bookableStore.loadedFor !== contextKey;
      }
      if (entry === "events") {
        return eventStore.loadedFor !== contextKey;
      }
      return true;
    });
    const bookableKnown =
      !force &&
      bookableID &&
      isDetailLoadedForCurrentAuth({ slug, bookableID });
    const eventKnown =
      !force &&
      eventID &&
      isDetailLoadedForCurrentAuth({ slug, eventID });
    const effectiveBookableID =
      bookableID && !bookableKnown ? bookableID : null;
    const effectiveEventID = eventID && !eventKnown ? eventID : null;

    if (
      !force &&
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
      authScope,
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
        getCachedData: force
          ? () => undefined
          : (key, nuxtApp) =>
              nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
      },
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

    if (data.value?.offersEnabled === false) {
      portalStore.$patch({ mode: "personal", loadedFor: contextKey });
      if (import.meta.server && event) {
        return await sendRedirect(event, `/account`, 302);
      }
      return navigateTo(`/account`);
    }

    applyBundleResponse(data.value, contextKey, {
      effectiveBookableID,
      effectiveEventID,
    });

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
      authScope: getAuthScope(),
    });
    clearNuxtData(cacheKey);
  }

  return {
    loadBundle,
    loadDetail,
    isDetailLoadedForCurrentAuth,
    clearBundleCache,
    invalidateBundle,
  };
}
