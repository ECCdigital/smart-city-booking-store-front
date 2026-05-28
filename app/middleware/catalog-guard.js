import { usePortalStore } from "~~/stores/portal.js";

export default defineNuxtRouteMiddleware(async () => {
    const portalStore = usePortalStore();

    if (!portalStore.initialized) {
        await portalStore.initialize();
    }

    if (portalStore.isPersonalMode) {
        return navigateTo("/account");
    }
});
