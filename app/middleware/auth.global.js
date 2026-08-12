import { useAuthStore } from "~~/stores/auth.js";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.authChecked) {
    const isValid = await authStore.validateAuth();
    if (!isValid) {
      authStore.invalidateAuth();
    }
  }

  const publicPaths = ["/login", "/register", "/sso/register", "/password"];
  const isPublicPage = publicPaths.some((p) => to.path.startsWith(p));

  if (to.meta.requiresAuth && !authStore.isLoggedIn && !isPublicPage) {
    // Encoded so deep links survive intact - a scanned door URL is the whole
    // point of the redirect and must not be cut off at its first query char.
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});