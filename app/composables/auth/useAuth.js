import { useAuthStore } from "~~/stores/auth.js";

export const useAuth = () => {
  const authStore = useAuthStore();

  const register = async (userData) => {
    const response = await $fetch("/api/auth/signup", {
      method: "POST",
      body: userData,
    });
    return response;
  };

  const verifyEmail = async (token, id) => {
    const response = await $fetch("/api/auth/verify-email", {
      method: "POST",
      body: { token, id },
    });
    return response;
  };
  const changePassword = async (id, password) => {
    return await $fetch("/api/auth/change-password", {
      method: "POST",
      body: { id, password },
    });
  };

  return {
    user: readonly(computed(() => authStore.user)),
    permission: readonly(computed(() => authStore.permission)),
    isLoggedIn: readonly(computed(() => authStore.isLoggedIn)),
    authChecked: readonly(computed(() => authStore.authChecked)),
    validateAuth: authStore.validateAuth,
    invalidateAuth: authStore.invalidateAuth,
    login: authStore.login,
    logout: authStore.logout,
    register,
    verifyEmail,
    changePassword,
  };
};
