import { useAuthStore } from "~~/stores/auth";
import { subscribeSessionEnded } from "~/utils/sharedAuthSync";

/**
 * Keep Storefront auth in sync when Admin (or another tab) ends the shared cookie session.
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  let checking = false;

  const revalidate = async () => {
    if (checking) return;
    if (!authStore.isLoggedIn && !authStore.tokenValid) return;

    checking = true;
    try {
      const ok = await authStore.validateAuth(true);
      if (!ok) {
        await authStore.handleInvalidSession({ redirect: true });
      }
    } finally {
      checking = false;
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      revalidate();
    }
  });
  window.addEventListener("focus", revalidate);

  subscribeSessionEnded(() => {
    authStore.handleInvalidSession({ redirect: true });
  });
});
