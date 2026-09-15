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

  const forgotPassword = async (email, resetUrl) => {
    return await $fetch("/api/auth/forgot-password", {
      method: "POST",
      body: { email, resetUrl },
    });
  };

  const resetPassword = async ({ token, password, id }) => {
    return await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: { token, password, id },
    });
  };

  const verifyCardLink = async (token, id) => {
    const response = await $fetch("/api/auth/card/verify-link", {
      method: "POST",
      body: { token, id },
    });
    return response;
  };

  const getCardAuthMethods = async () => {
    const response = await $fetch("/api/auth/card-methods");
    return response.data;
  };

  const cardSignup = async (payload) => {
    const response = await $fetch("/api/auth/card/signup", {
      method: "POST",
      body: payload,
    });
    return response.data;
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
    verifyCardLink,
    changePassword,
    getCardAuthMethods,
    cardSignup,
    cardLogin: authStore.cardLogin,
    forgotPassword,
    resetPassword,
  };
};
