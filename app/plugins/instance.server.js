import { useInstanceStore } from "~~/stores/instance.js";
import { usePortalStore } from "~~/stores/portal.js";

export default defineNuxtPlugin(async () => {
    const instanceStore = useInstanceStore();
    const portalStore = usePortalStore();

    await Promise.all([
        instanceStore.initialize(),
        portalStore.initialize(),
    ]);
});
