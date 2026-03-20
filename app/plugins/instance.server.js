import { useInstanceStore } from "~~/stores/instance.js";

export default defineNuxtPlugin(async () => {
    const instanceStore = useInstanceStore();

    if (!instanceStore.instance) {
        await instanceStore.fetchInstance();
    }
});