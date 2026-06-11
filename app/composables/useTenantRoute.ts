import { computed } from "vue";
import { useRoute } from "vue-router";
import { useTenant } from "./useTenant";

export const useTenantRoute = () => {
  const route = useRoute();
  const { tenantID, isTenantContext } = useTenant();

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

  function normalizePath(p: string) {
    const withoutQuery = p.split("?")[0].split("#")[0];
    return withoutQuery.length > 1
      ? withoutQuery.replace(/\/+$/, "")
      : withoutQuery;
  }

  function isActivePath(path: string) {
    let targetPath = normalizePath(tenantPath(path));
    const currentPath = normalizePath(route.path);

    const suffix = itemID.value || bookingID.value;
    if (suffix && !targetPath.endsWith(`/${suffix}`)) {
      targetPath += `/${suffix}`;
    }

    return currentPath === targetPath;
  }

  return {
    tenantID,
    isTenantContext,
    tenantPath,
    isActivePath,
    tenantTo,
  };
};
