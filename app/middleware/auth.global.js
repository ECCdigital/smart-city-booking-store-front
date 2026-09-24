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

  // Shared-session rule: force login only in the personal areas
  // (/account/*, /mobile-key/*) — never on public catalog pages.
  const isMobileKeyPath =
    to.path === "/mobile-key" || to.path.startsWith("/mobile-key/");
  if (
    (isAccountPath(to.path) || isMobileKeyPath) &&
    to.meta.requiresAuth &&
    !authStore.isLoggedIn &&
    !isPublicPage
  ) {
    // Encoded so deep links survive intact - a scanned door URL is the whole
    // point of the redirect and must not be cut off at its first query char.
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});