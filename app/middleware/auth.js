import { useAuth } from "~/composables/auth/useAuth.js";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { validateAuth } = useAuth();

  const isValid = await validateAuth();

  if (!isValid) {
    return navigateTo(`/login?redirect=${to.fullPath}`);
  }
});
