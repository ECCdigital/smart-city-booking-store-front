import { useInstanceStore } from "~~/stores/instance";

export function useSsoConfig() {
    const instanceStore = useInstanceStore();

    const ssoEnabled = computed(() => {
        return !!instanceStore.instance?.applications?.find(
            (app: any) => app.id === "keycloak" && app.active
        );
    });

    return { ssoEnabled };
}