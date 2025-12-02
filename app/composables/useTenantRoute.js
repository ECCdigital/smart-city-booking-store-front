export const useTenantRoute = () => {
  const route = useRoute();
  const tenantSlug = computed(() => route.params.tenantID);

  function tenantPath(path) {
    if (!tenantSlug.value) return path;

    if (path.startsWith("/t/")) return path;

    const cleaned = path.startsWith("/") ? path : `/${path}`;
    return `/t/${tenantSlug.value}${cleaned}`;
  }

  function tenantTo(to) {
    if (!tenantSlug.value) return to;

    if (typeof to === "string") {
      return tenantPath(to);
    }

    const clone = {
      ...to,
      params: {
        ...to.params,
        tenantSlug: tenantSlug.value,
      },
    };
    return clone;
  }

  return {
    tenantSlug,
    tenantPath,
    tenantTo,
  };
};
