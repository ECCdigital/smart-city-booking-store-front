import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { useCatalog } from "~/composables/api/useCatalog.js";

export function useCatalogBundle() {
  const { fetchCatalogBundle } = useCatalog();
  const catalogStore = useCatalogStore();
  const bookableStore = useBookableStore();
  const eventStore = useEventStore();
  const tenantStore = useTenantStore();

  async function loadBundle({ tenantID, bookableID, eventID, include = [] }) {

      const { data, error } = await useAsyncData(
          `catalog:${tenantID}:${bookableID || eventID || include.sort().join(",")}`,
          () =>
              fetchCatalogBundle({
                tenantID,
                bookableID,
                eventID,
                include: include.join(","),
              }),
          { server: true }
      );

    if (error.value) {
      handleError(error.value.data);
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
      eventStore.$patch({ events: data.value.events });
    }
    if (data.value?.event) {
      eventStore.addOrUpdate(data.value.event);
    }
    if (data.value?.tenants) {
        tenantStore.$patch({ tenants: data.value.tenants });
    }

    return data.value;
  }

  return { loadBundle };
}
