import { defineStore } from "pinia";

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
    },
    async validateAuth(force = false) {
      if (!force && this.authChecked && this.tokenValid && this.user) {
        return true;
      }

      try {
        const { error, data } = await useFetch("/api/auth/me", {
          method: "GET",
          key: "auth-validation",
          server: true,
        });

        this.authChecked = true;
        const fetchError = error?.value;

        if (fetchError || data.value?.success === false) {
          this.clearAuthPayload();
          return false;
        }

        this.user = data.value?.data?.user || null;
        this.permission = data.value?.data?.permissions || null;
        this.tokenValid = true;
        return true;
      } catch (error) {
        console.error("validateAuth error:", error);
        this.authChecked = true;
        this.clearAuthPayload();
        return false;
      }
    },
    async login(credentials) {
      try {
        const { error, data } = await useFetch("/api/auth/login", {
          method: "POST",
          server: true,
          body: credentials,
        });

        const fetchError = error?.value;

        if (fetchError || data.value?.success === false) {
          throw createError({
            success: false,
            statusCode: fetchError?.response?.status || 500,
            statusMessage:
              fetchError?.response?.data?.message || "Login failed",
          });
        }

        this.user = data.value?.data?.user || null;
        this.permission = data.value?.data?.permissions || null;
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
        await $fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        this.invalidateAuth();
      }
    },
    invalidateAuth() {
      this.clearAuthPayload();
      this.authChecked = false;
    },
  },
  persist: {
    key: "auth-store",
    storage: process.client ? localStorage : undefined,
    paths: ["user", "permission", "tokenValid"],
  },
});
