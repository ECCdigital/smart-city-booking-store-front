import { useAuth } from "~/composables/auth/useAuth.js";

export default defineNuxtRouteMiddleware(async (to) => {
  const { validateAuth } = useAuth();

  try {
    const isValid = await validateAuth();

    if(!isValid) {
      return navigateTo(`/login?redirect=${to.fullPath}`);
    };

  } catch (error) {
      if (error.statusCode === 401) {
          return navigateTo(`/login?redirect=${to.fullPath}`);
      }
      console.warn("User pages not found for auth check.");
  }
})