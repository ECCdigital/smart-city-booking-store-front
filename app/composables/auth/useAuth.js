import { useAuthStore } from "~~/stores/auth.js";

export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    user: readonly(computed(() => authStore.user)),
    permission: readonly(computed(() => authStore.permission)),
    isLoggedIn: readonly(computed(() => authStore.isLoggedIn)),
    authChecked: readonly(computed(() => authStore.authChecked)),
    validateAuth: authStore.validateAuth,
    invalidateAuth: authStore.invalidateAuth,
    login: authStore.login,
    logout: authStore.logout,
  };
};
