import { computed } from "vue";
import { useRoute } from "vue-router";
import { isCheckoutPath, stripCheckoutQuery } from "~/utils/checkoutQuery";
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

  function resolveTargetPath(to: string | Record<string, unknown>): string {
    if (typeof to === "string") return to;
    if (typeof to.path === "string") return to.path;
    return "";
  }

  function queryForNavigation(
    to: string | Record<string, unknown>,
  ): Record<string, string | string[]> {
    const targetPath = resolveTargetPath(to);
    const canResolveTargetPath = targetPath.length > 0;
    const leavingCheckout =
      canResolveTargetPath &&
      isCheckoutPath(route.path) &&
      !isCheckoutPath(tenantPath(targetPath));

    const baseQuery = leavingCheckout
      ? stripCheckoutQuery(route.query as Record<string, unknown>)
      : (route.query as Record<string, string | string[]>);

    if (typeof to === "string") {
      return baseQuery;
    }

    return {
      ...baseQuery,
      ...((to.query as Record<string, string | string[]>) || {}),
    };
  }

  function tenantTo(to: string | Record<string, unknown>) {
    const navigationQuery = queryForNavigation(to);

    if (typeof to === "string") {
      return {
        path: tenantPath(to),
        query: navigationQuery,
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

    clone.query = navigationQuery;

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
