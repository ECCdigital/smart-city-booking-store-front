import { useAuthStore } from "~~/stores/auth.js";
import { isAccountPath } from "~/utils/sharedAuthSync";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // Re-check cookie session when entering account area (may have been cleared in Admin)
  if (isAccountPath(to.path)) {
    await authStore.validateAuth(true);
  } else if (!authStore.authChecked) {
    await authStore.validateAuth();
  }

  const publicPaths = ["/login", "/register", "/sso/register", "/password"];
  const isPublicPage = publicPaths.some((p) => to.path.startsWith(p));

  // Shared-session rule: force login only under /account/*
  if (
    isAccountPath(to.path) &&
    to.meta.requiresAuth &&
    !authStore.isLoggedIn &&
    !isPublicPage
  ) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});