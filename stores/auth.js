import { defineStore } from "pinia";
import { useUsers } from "~/composables/api/useUsers.js";
import { useAuth } from "~/composables/auth/useAuth.js";
import {
  broadcastSessionEnded,
  isAccountPath,
} from "~/utils/sharedAuthSync";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    permission: null,
    tokenValid: false,
    authChecked: false,
  }),
  getters: {
    isLoggedIn: (state) => state.tokenValid && !!state.user,
    getUser: (state) => state.user,
  },
  actions: {
    setAuthPayload(payload) {
      this.user = payload?.user || null;
      this.permission = payload?.permission || null;
      this.tokenValid = !!payload?.tokenValid;
    },
    clearAuthPayload() {
      this.user = null;
      this.permission = null;
      this.tokenValid = false;
      this.authChecked = true;
    },
    async validateAuth(force = false) {
      if (!force && this.authChecked) {
        return this.isLoggedIn;
      }
      try {
        const headers = import.meta.server
          ? useRequestHeaders(["cookie"])
          : undefined;

        const data = await $fetch("/api/auth/me", { headers });

        if (!data?.success) throw new Error("invalid");
        this.user = data.data?.user || null;
        this.permission = data.data?.permissions || null;
        this.tokenValid = true;
        return true;
      } catch {
        this.user = null;
        this.permission = null;
        this.tokenValid = false;
        return false;
      } finally {
        this.authChecked = true;
      }
    },
    _applyAuthPayload(data) {
      this.user = data?.user || null;
      this.permission = data?.permissions || null;
      this.tokenValid = true;
      this.authChecked = true;
    },

    async login(credentials) {
      const data = await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      if (!data?.success)
        throw createError({ statusCode: 401, statusMessage: "Login failed" });
      this._applyAuthPayload(data.data);
      return true;
    },
    async cardLogin(payload) {
      const data = await $fetch("/api/auth/card/signin", {
        method: "POST",
        body: payload,
      });
      if (!data?.success)
        throw createError({
          statusCode: 401,
          statusMessage: "Card login failed",
        });
      if (data.data?.requiresRegistration) {
        return {
          requiresRegistration: true,
          prefill: data.data.prefill,
          cardInfo: data.data.cardInfo,
        };
      }
      this._applyAuthPayload(data.data);
      return { requiresRegistration: false };
    },
    async logout() {
      // Notify Admin / other tabs immediately (before cookie clear round-trip)
      broadcastSessionEnded();
      try {
        const authType = useCookie("auth-type").value;

        if (authType === "keycloak") {
          await $fetch("/api/auth/sso/logout", { method: "POST" });
        } else {
          await $fetch("/api/auth/logout", { method: "POST" });
        }
      } finally {
        this.invalidateAuth({ broadcast: true });
      }
    },
    invalidateAuth({ broadcast = false } = {}) {
      this.clearAuthPayload();
      if (import.meta.client) {
        localStorage.removeItem("auth-store");
        if (broadcast) {
          broadcastSessionEnded();
        }
      }
    },
    /**
     * Cookie session dead (logout elsewhere / refresh failed).
     * Clears Pinia user; redirects to login only on /account/*.
     */
    async handleInvalidSession({ redirect = true } = {}) {
      const wasLoggedIn = this.isLoggedIn || this.tokenValid;
      this.invalidateAuth({ broadcast: false });
      if (!import.meta.client || !redirect || !wasLoggedIn) return;

      const path = useRoute().path;
      if (isAccountPath(path)) {
        await navigateTo(`/login?redirect=${encodeURIComponent(path)}`);
      }
    },
    async updateUser(user) {
      const { updateUser } = useUsers();
      try {
        await updateUser({ ...user, syncSelfBookingNames: false });

        this.user = user;
        return this.user;
      } catch (error) {
        console.error("Error updating user in store:", error);
        this.user = null;
      }
    },
    async changePassword(id, newPassword) {
      const { changePassword } = useAuth();
      try {
        await changePassword(id, newPassword);
        return true;
      } catch (error) {
        console.error("Error changing password:", error);
        return false;
      }
    },
  },
});
