import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { usePortalStore } from "~~/stores/portal.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import { sendRedirect } from "h3";

function buildBundleKey({ slug, tenantID, bookableID, eventID, include }) {
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
  ].join(":");
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

    console.log("Loading bundle with slug:", slug);
    console.log("Tenant ID:", tenantID.value);
    console.log("Bookable ID:", bookableID);
    console.log("Event ID:", eventID);
    console.log("Include:", include);

    const cacheKey = buildBundleKey({
      slug,
      tenantID: tenantID.value,
      bookableID,
      eventID,
      include,
    });

    const event = import.meta.server ? useRequestEvent() : null;
    const includeList = Array.isArray(include) ? include : [include];

    const { data, error } = await useAsyncData(
      cacheKey,
      () =>
        fetchCatalogBundle({
          slug,
          tenantID: tenantID.value,
          bookableID,
          eventID,
          include: includeList.filter(Boolean).join(","),
        }),
      {
        server: true,
        dedupe: "defer",
        getCachedData: (key, nuxtApp) =>
          nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
      }
    );

    console.log("Bundle data:", data.value);

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
      });
    }

    if (data.value?.offersEnabled === false) {
      portalStore.$patch({ mode: "personal" });
      if (import.meta.server && event) {
        return await sendRedirect(event, `/account`, 302);
      }
      return navigateTo(`/account`);
    }

    if (data.value?.catalog) {
      catalogStore.$patch({ catalog: data.value.catalog });
    }
    if (data.value?.bookables) {
      bookableStore.$patch({ bookables: data.value.bookables });
    }
    if (data.value?.bookable) {
      bookableStore.addOrUpdate(data.value.bookable);
    }
    if (data.value?.events) {
      const eventsWithType = data.value.events.map((evt) => ({
        ...evt,
        type: "event",
      }));
      eventStore.$patch({ events: eventsWithType });
    }
    if (data.value?.event) {
      eventStore.addOrUpdate(data.value.event);
    }
    if (data.value?.tenants) {
      tenantStore.$patch({ tenants: data.value.tenants });
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
    });
    clearNuxtData(cacheKey);
  }

  return { loadBundle, clearBundleCache };
}
