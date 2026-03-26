import { useAuthStore } from "~~/stores/auth";
import { useInstanceStore } from "~~/stores/instance";

export default defineNuxtPlugin(async () => {
    const runtimeConfig = useRuntimeConfig();

    if (!runtimeConfig.public.silentSsoEnabled) return;

    const authStore = useAuthStore();
    const instanceStore = useInstanceStore();

    if (authStore.isLoggedIn) return;

    const authType = useCookie("auth-type");
    if (authType.value) return;

    if (!instanceStore.ssoEnabled) return;

    const route = useRoute();
    const skipPaths = ["/login", "/sso/", "/register", "/password"];
    if (skipPaths.some((p) => route.path.startsWith(p))) return;

    const silentCheckDone = useCookie("sso-silent-checked", {
        maxAge: 60 * 5,
        default: () => false,
    });

    if (silentCheckDone.value) return;
    silentCheckDone.value = true;

    const currentPath = route.fullPath;
    window.location.href = `/api/auth/sso/silent-check?redirect=${encodeURIComponent(currentPath)}`;
});