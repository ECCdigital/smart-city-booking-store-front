import { useAuthStore } from "~~/stores/auth.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";

type ReloadParams = {
  slug: string | null;
  include: string[];
  bookableID?: string;
  eventID?: string;
};

function buildExpectedContextKey(
  slug: string | null,
  tenantID: string | null | undefined,
  authScope: "auth" | "anon",
) {
  return [slug ?? "root", tenantID ?? "all", authScope].join(":");
}

function resolveReloadParams(route: ReturnType<typeof useRoute>): ReloadParams | null {
  const slug =
    typeof route.params.catalogSlug === "string"
      ? route.params.catalogSlug
      : null;

  const bookableID =
    typeof route.params.bookableID === "string"
      ? route.params.bookableID
      : undefined;
  const eventID =
    typeof route.params.eventID === "string" ? route.params.eventID : undefined;

  if (bookableID) {
    return { slug, include: [], bookableID };
  }

  if (eventID) {
    return { slug, include: [], eventID };
  }

  if (route.path.includes("/bookables")) {
    return { slug, include: ["bookables", "events"] };
  }

  if (route.path.includes("/events")) {
    return { slug, include: ["bookables", "events"] };
  }

  return { slug, include: ["bookables", "events"] };
}

export function useCatalogAuthReload() {
  if (!import.meta.client) return;

  const authStore = useAuthStore();
  const bookableStore = useBookableStore();
  const eventStore = useEventStore();
  const route = useRoute();
  const { tenantID } = useTenant();
  const { loadBundle, loadDetail, isDetailLoadedForCurrentAuth, invalidateBundle } =
    useCatalogBundle();
  const reloading = ref(false);

  function hasStaleAuthScope() {
    const slug =
      typeof route.params.catalogSlug === "string"
        ? route.params.catalogSlug
        : null;
    const bookableID =
      typeof route.params.bookableID === "string"
        ? route.params.bookableID
        : undefined;
    const eventID =
      typeof route.params.eventID === "string" ? route.params.eventID : undefined;

    if (bookableID || eventID) {
      return !isDetailLoadedForCurrentAuth({ slug, bookableID, eventID });
    }

    const expectedKey = buildExpectedContextKey(
      slug,
      tenantID.value,
      authStore.isLoggedIn ? "auth" : "anon",
    );

    const loadedScopes = [bookableStore.loadedFor, eventStore.loadedFor].filter(
      Boolean,
    );

    if (loadedScopes.length === 0) {
      return false;
    }

    return loadedScopes.some((loadedFor) => loadedFor !== expectedKey);
  }

  async function reloadCatalogData(force = false) {
    const params = resolveReloadParams(route);
    if (!params || reloading.value) return;

    const isDetailRoute = Boolean(params.bookableID || params.eventID);

    reloading.value = true;
    if (force && !isDetailRoute) {
      invalidateBundle();
    }

    try {
      await authStore.validateAuth(true);

      if (isDetailRoute) {
        await loadDetail({
          slug: params.slug,
          bookableID: params.bookableID,
          eventID: params.eventID,
          force: true,
        });
        return;
      }

      await loadBundle({
        slug: params.slug,
        include: params.include,
        force,
      });
    } catch (error) {
      console.error("[useCatalogAuthReload] Failed to reload catalog data:", error);
    } finally {
      reloading.value = false;
    }
  }

  onMounted(() => {
    if (hasStaleAuthScope()) {
      void reloadCatalogData(true);
    }
  });

  watch(
    () => authStore.isLoggedIn,
    async (loggedIn, wasLoggedIn) => {
      if (wasLoggedIn === undefined || loggedIn === wasLoggedIn) {
        return;
      }

      await reloadCatalogData(true);
    },
  );
}
