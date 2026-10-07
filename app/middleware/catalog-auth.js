import { useAuth } from "~/composables/auth/useAuth.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import {
  appendReturnTarget,
  parseReturnTarget,
} from "~~/shared/utils/returnTarget";

// Back to the page itself, query included: encoded, or the login would read
// the page's own query as its own. Only an in-app path is carried along.
const loginPathFor = (to) =>
  appendReturnTarget("/login", parseReturnTarget(to.fullPath));

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.params?.catalogSlug) return;

  const { validateAuth } = useAuth();

  try {
    const { fetchCatalog } = useCatalog();
    const catalogData = await fetchCatalog(to.params.catalogSlug);

    if (catalogData?.offersEnabled === false) {
      return navigateTo("/account");
    }

    if (catalogData?.visibility === "private") {
      const authValid = await validateAuth();

      if (!authValid) {
        return navigateTo(loginPathFor(to));
      }
    }

    if (catalogData?.visibility === "unlisted") {
      //TODO: Implement unlisted catalog access logic
      return;
    }
  } catch (error) {
    if (error.statusCode === 401) {
      return navigateTo(loginPathFor(to));
    }
    console.warn("Catalog not found for auth check:", to.params.catalogSlug);
  }
});
