import {useAuth} from "~/composables/auth/useAuth.js";
import {useCatalog} from "~/composables/api/useCatalog.js";

export default defineNuxtRouteMiddleware(async (to) => {
    if (!to.params?.catalogSlug) return;

    const { validateAuth } = useAuth();

    try {
        const { fetchCatalog } = useCatalog();
        const catalogData = await fetchCatalog(to.params.catalogSlug);

        if (catalogData?.visibility === 'private') {
            const authValid = await validateAuth();

            if (!authValid) {
                return navigateTo(`/login?redirect=${to.fullPath}`);
            }
        }

        if(catalogData?.visibility === 'unlisted') {
            //TODO: Implement unlisted catalog access logic
            return;
        }

    } catch (error) {
        console.error('Error during catalog auth check:', error);
        if (error.statusCode === 401) {
            return navigateTo(`/login?redirect=${to.fullPath}`);
        }
        console.warn('Catalog not found for auth check:', to.params.catalogSlug);
    }
});