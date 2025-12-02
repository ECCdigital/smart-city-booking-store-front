import AuthService from "~~/server/service/AuthService.js";

export default defineEventHandler(async (event) => {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  const accessToken = getCookie(event, "access-token");
  const refreshToken = getCookie(event, "refresh-token");

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  try {
    const response = await $fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return { success: true, data: response };
  } catch (error) {
    if (error.response?.status === 401) {
      const { success, accessToken: newAccessToken } =
        await AuthService.refreshToken(event, refreshToken);

      if (!success) {
        throw createError({
          statusCode: 401,
          statusMessage: "Token refresh failed",
        });
      }

      const retryResponse = await $fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });

      return { success: true, data: retryResponse };
    }

    throw createError({
      success: false,
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.data?.message || "Failed to get user info",
    });
  }
});
