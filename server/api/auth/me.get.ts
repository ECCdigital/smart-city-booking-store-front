import AuthService from "~~/server/service/AuthService.js";
import {
  getKeycloakConfig,
  getKeycloakEndpoints,
} from "~~/server/utils/keycloak";

export default defineEventHandler(async (event) => {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
  const accessToken = getCookie(event, "access-token");
  const refreshToken = getCookie(event, "refresh-token");
  const authType = getCookie(event, "auth-type");

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Not authenticated",
    });
  }

  try {
    const response = await $fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { success: true, data: response };
  } catch (error: any) {
    if (error.response?.status !== 401 || !refreshToken) {
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: "Failed to get user info",
      });
    }

    // Token abgelaufen → Refresh versuchen
    let newAccessToken: string | null = null;

    if (authType === "keycloak") {
      newAccessToken = await refreshKeycloakToken(event, refreshToken);
    } else {
      const result = await AuthService.refreshToken(event, refreshToken);
      newAccessToken = result.success ? result.accessToken : null;
    }

    if (!newAccessToken) {
      clearAuthCookies(event);
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

async function refreshKeycloakToken(
    event: any,
    refreshToken: string
): Promise<string | null> {
  try {
    const config = await getKeycloakConfig();
    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);

    const response: any = await $fetch(endpoints.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.publicClient,
        refresh_token: refreshToken,
      }).toString(),
    });

    const secure = process.env.NODE_ENV === "production";

    setCookie(event, "access-token", response.access_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    if (response.refresh_token) {
      setCookie(event, "refresh-token", response.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response.access_token;
  } catch (err) {
    console.error("Keycloak token refresh failed:", err);
    return null;
  }
}

function clearAuthCookies(event: any) {
  deleteCookie(event, "access-token");
  deleteCookie(event, "refresh-token");
  deleteCookie(event, "auth-type");
}