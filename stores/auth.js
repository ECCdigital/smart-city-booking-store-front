import { defineStore } from "pinia";
import { useUsers } from "~/composables/api/useUsers.js";
import { useAuth } from "~/composables/auth/useAuth.js";

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
    async login(credentials) {
      try {
        const data = await $fetch("/api/auth/login", {
          method: "POST",
          body: credentials,
        });

        if (!data?.success) {
          throw createError({
            statusCode: 401,
            statusMessage: data?.message || "Login failed",
          });
        }

        this.user = data.data?.user || null;
        this.permission = data.data?.permissions || null;
        this.tokenValid = true;
        this.authChecked = true;
        return true;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    async logout() {
      try {
        const authType = useCookie("auth-type").value;

        if (authType === "keycloak") {
          await $fetch("/api/auth/sso/logout", { method: "POST" });
        } else {
          await $fetch("/api/auth/logout", { method: "POST" });
        }
      } finally {
        this.invalidateAuth();
      }
    },
    invalidateAuth() {
      this.clearAuthPayload();
      this.authChecked = false;
      if (import.meta.client) {
        localStorage.removeItem("auth-store");
      }
    },
    async updateUser(user) {
      const { updateUser } = useUsers();
      try {
        await updateUser(user);

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
