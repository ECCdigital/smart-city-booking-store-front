import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import { sendRedirect } from "h3";

export function useCatalogBundle() {
  const { fetchCatalogBundle } = useCatalog();
  const catalogStore = useCatalogStore();
  const bookableStore = useBookableStore();
  const eventStore = useEventStore();
  const tenantStore = useTenantStore();
  const config = useRuntimeConfig();

  const cacheEnabled = config.public.cacheEnabled;
  const adminBaseUrl = config.public.adminBaseUrl;

  async function loadBundle({ tenantID, bookableID, eventID, include = [] }) {
    const cacheKey = `catalog:${tenantID}:${
      bookableID || eventID || include.sort().join(",")
    }`;
    const event = import.meta.server ? useRequestEvent() : null;

    const { data, error } = await useAsyncData(
      cacheKey,
      () =>
        fetchCatalogBundle({
          tenantID,
          bookableID,
          eventID,
          include: include.join(","),
        }),
      {
        server: true,
        getCachedData: cacheEnabled ? undefined : () => undefined,
        dedupe: cacheEnabled ? "defer" : "cancel",
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
      const eventsWithType = data.value.events.map((event) => ({
        ...event,
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

  function clearBundleCache(tenantID, bookableID, eventID, include = []) {
    const cacheKey = `catalog:${tenantID}:${
      bookableID || eventID || include.sort().join(",")
    }`;
    clearNuxtData(cacheKey);
  }

  return { loadBundle, clearBundleCache };
}
