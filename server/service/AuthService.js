class AuthService {
  static async refreshToken(event, refreshToken) {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    try {
      const response = await $fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        body: { refreshToken },
      });

      const { accessToken, refreshToken: newRefreshToken } = response;

      setCookie(event, "access-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      setCookie(event, "refresh-token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      deleteCookie(event, "access-token", { path: "/" });
      deleteCookie(event, "refresh-token", { path: "/" });
      return { success: false, error: "Token refresh failed" };
    }
  }
}

export default AuthService;
