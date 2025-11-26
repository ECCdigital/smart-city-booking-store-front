export const useAuth = () => {
  const user = useState("user", () => null);
  const permission = useState("permission", () => null);
  const authChecked = useState("authChecked", () => false);
  const tokenValid = useState("tokenValid", () => false);
  const isLoggedIn = computed(() => tokenValid.value && !!user.value);

  const validateAuth = async () => {
    if (authChecked.value && tokenValid.value) {
      return true;
    }

    try {
      const { error, data } = await useFetch("/api/auth/me", {
        method: "GET",
        key: "auth-validation",
        server: true,
      });

      authChecked.value = true;

      if (error.value || data.value?.success === false) {
        tokenValid.value = false;
        user.value = null;
        permission.value = null;
        return false;
      } else if (data.value?.success === true) {
        tokenValid.value = true;
        user.value = data.value.data.user;
        permission.value = data.value.data.permissions;
        return true;
      }

      return false;
    } catch (error) {
      authChecked.value = true;
      tokenValid.value = false;
      user.value = null;
      permission.value = null;
      return false;
    }
  };

  const login = async (credentials) => {
    try {
      const { error, data } = await useFetch(`/api/auth/login`, {
        method: "POST",
        server: true,
        body: credentials,
      });

      console.log("Login response data:", data.value);
      console.log("Login response error:", error.value);

      if (error.value || data.value?.success === false) {
        createError({
          success: false,
          statusCode: error.response?.status || 500,
          statusMessage: error.response?.data?.message || "Login failed",
        });
      } else if (data.value?.success === true) {
        user.value = data.value.data.user;
        permission.value = data.value.data.permissions;

        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
      invalidateAuth();
      await navigateTo("/login");
    } catch (error) {
      invalidateAuth();
      await navigateTo("/login");
    }
  };

  const fetchUser = async () => {
    try {
      const { error, data } = await useFetch("/api/auth/me", {
        method: "GET",
      });

      if (error.value || data.value?.success === false) {
        createError({
          success: false,
          statusCode: error.response?.status || 500,
          statusMessage: error.response?.data?.message || "Login failed",
        });
      } else if (data.value?.success === true) {
        user.value = data.value.data.user;
        permission.value = data.value.data.permissions;

        return true;
      }

      return false;
    } catch (error) {
      user.value = null;
      permission.value = null;
      throw error;
    }
  };

  const signup = async (userData) => {
    const response = await $fetch("/api/auth/signup", {
      method: "POST",
      body: userData,
    });
    return response;
  };

  const invalidateAuth = () => {
    authChecked.value = false;
    tokenValid.value = false;
  };

  return {
    user: readonly(user),
    permission: readonly(permission),
    isLoggedIn,
    authChecked: readonly(authChecked),
    validateAuth,
    invalidateAuth,
    login,
    logout,
  };
};
