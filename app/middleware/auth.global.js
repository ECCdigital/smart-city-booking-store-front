import {useAuthStore} from "~~/stores/auth.js";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.authChecked) {
    const isValid = await authStore.validateAuth();

    if (!isValid) {
      authStore.invalidateAuth();
    }
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn && to.path !== "/login") {
    return navigateTo(`/login?redirect=${to.fullPath}`);
  }
});
