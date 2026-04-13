import { useInstanceStore } from "~~/stores/instance.js";

export default defineNuxtRouteMiddleware(async (to) => {
    const instanceStore = useInstanceStore();

    if (!instanceStore.instance) {
        await instanceStore.fetchInstance();
    }

    if (!instanceStore.catalogEnabled) {
        return navigateTo("/account");
    }
});