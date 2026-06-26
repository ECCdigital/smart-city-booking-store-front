import { useAuthStore } from "~~/stores/auth.js";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.authChecked) {
    await authStore.validateAuth();
  }

  const publicPaths = ["/login", "/register", "/sso/register", "/password"];
  const isPublicPage = publicPaths.some((p) => to.path.startsWith(p));

  if (to.meta.requiresAuth && !authStore.isLoggedIn && !isPublicPage) {
    return navigateTo(`/login?redirect=${to.fullPath}`);
  }
});