import { computed } from "vue";
import { useRoute } from "vue-router";

export const useTenantRoute = () => {
  const route = useRoute();

  const tenantID = computed(() => route.params.tenantID as string | undefined);
  const itemID = computed(() => {
    const id =
      route.params.locationID ||
      route.params.bookableID ||
      route.params.eventID;
    return id as string | undefined;
  });
  const bookingID = computed(() => {
    const id = route.params.bookingID;
    return id as string | undefined;
  });

  function tenantPath(path: string) {
    if (!tenantID.value) return path;

    if (path.startsWith("/t/")) return path;

    const cleaned = path.startsWith("/") ? path : `/${path}`;
    return `/t/${tenantID.value}${cleaned}`;
  }

  function tenantTo(to: string | Record<string, any>) {
    const currentQuery = route.query;

    if (typeof to === "string") {
      return {
        path: tenantPath(to),
        query: currentQuery,
      };
    }

    const clone = { ...to };

    if (
      tenantID.value &&
      clone.name &&
      !String(clone.name).startsWith("tenant-")
    ) {
      clone.name = `tenant-${clone.name}`;
      clone.params = {
        ...clone.params,
        tenantID: tenantID.value,
      };
    }

    clone.query = { ...currentQuery, ...(to.query || {}) };

    return clone;
  }

  function isActivePath(path: string) {
    let targetPath = tenantPath(path);

    if (itemID.value) {
      targetPath += `/${itemID.value}`;
    } else if (bookingID.value) {
      targetPath += `/${bookingID.value}`;
    }
    return route.path === targetPath;
  }

  return {
    tenantID,
    tenantPath,
    isActivePath,
    tenantTo,
  };
};
