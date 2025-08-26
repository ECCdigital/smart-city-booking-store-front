class AuthService {
  static async refreshToken(event, refreshToken) {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    try {
      const response = await $fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        body: { refreshToken },
      });

      const { accessToken, refreshToken: newRefreshToken } = response;

      setCookie(event, "access-token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });

      setCookie(event, "refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });



      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      deleteCookie(event, "access-token");
      deleteCookie(event, "refresh-token");
      return {
        success: false,
        error: "Token refresh failed",
      };
    }
  }
}

export default AuthService;
