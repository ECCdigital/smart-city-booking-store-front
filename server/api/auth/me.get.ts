import AuthService from "~~/server/service/AuthService.js";
import { clearAuthCookies } from "~~/server/utils/authCookies";
import type { UpstreamError } from "~~/server/utils/upstreamError";

export default defineEventHandler(async (event) => {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
  let accessToken = getCookie(event, "access-token");
  const refreshToken = getCookie(event, "refresh-token");

  if (!accessToken && !refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  if (!accessToken && refreshToken) {
    accessToken = (await AuthService.renewAccessToken(event)) ?? undefined;
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Token refresh failed",
      });
    }
  }

  try {
    const response = await $fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { success: true, data: response };
  } catch (err) {
    const error = err as UpstreamError;
    if (error.response?.status !== 401) {
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: "Failed to get user info",
      });
    }

    // Without a refresh token, or when it is refused, the renewal clears the
    // cookies: the session is over.
    const newAccessToken = await AuthService.renewAccessToken(event);

    if (!newAccessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Token refresh failed",
      });
    }

    try {
      const retryResponse = await $fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });
      return { success: true, data: retryResponse };
    } catch {
      clearAuthCookies(event);
      throw createError({
        statusCode: 401,
        statusMessage: "Retry after refresh failed",
      });
    }
  }
});
