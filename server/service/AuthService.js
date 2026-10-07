import {
  getKeycloakConfig,
  getKeycloakEndpoints,
} from "~~/server/utils/keycloak";
import {
  authCookieOptions,
  clearAuthCookies,
} from "~~/server/utils/authCookies";
import { logger } from "~~/server/api/utils/logger.js";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * How long the outcome of a renewal stays at hand for requests that still
 * carry the refresh token it used. The backend revokes a refresh token when it
 * is used, so a second renewal with it fails and ends the session. Requests
 * the browser sends side by side all carry the same cookies; they share one
 * renewal while it runs and take its tokens for a few seconds after.
 */
const SHARED_RENEWAL_MS = 10_000;

/** @type {Map<string, Promise<{ accessToken: string, refreshToken?: string } | null>>} */
const renewals = new Map();

async function requestLocalTokens(refreshToken) {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
  const response = await $fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    body: { refreshToken },
  });
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  };
}

async function requestKeycloakTokens(refreshToken) {
  const config = await getKeycloakConfig();
  const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);
  const response = await $fetch(endpoints.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.publicClient,
      refresh_token: refreshToken,
    }).toString(),
  });
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  };
}

/** One renewal per refresh token, shared by every request that carries it. */
function sharedRenewal(refreshToken, authType) {
  const key = `${authType === "keycloak" ? "keycloak" : "local"}:${refreshToken}`;
  let renewal = renewals.get(key);
  if (renewal) return renewal;

  renewal = (
    authType === "keycloak"
      ? requestKeycloakTokens(refreshToken)
      : requestLocalTokens(refreshToken)
  ).catch((error) => {
    logger.warn(
      { status: error?.statusCode, authType: authType || "local" },
      "Token renewal failed",
    );
    return null;
  });
  renewals.set(key, renewal);
  renewal.then((tokens) => {
    if (!tokens) {
      renewals.delete(key);
      return;
    }
    setTimeout(() => renewals.delete(key), SHARED_RENEWAL_MS).unref?.();
  });
  return renewal;
}

class AuthService {
  /**
   * Renews the access token of the request's session with its refresh token,
   * at the backend or, for an SSO session (`auth-type=keycloak`), at
   * Keycloak, and sets the new cookies on the request's answer.
   *
   * @param {import("h3").H3Event} event
   * @returns {Promise<string | null>} The new access token. `null` when the
   *   request has no refresh token, or when the renewal failed: then the
   *   session is over and its cookies are cleared.
   */
  static async renewAccessToken(event) {
    const refreshToken = getCookie(event, "refresh-token");
    if (!refreshToken) return null;

    const tokens = await sharedRenewal(
      refreshToken,
      getCookie(event, "auth-type"),
    );
    if (!tokens) {
      clearAuthCookies(event);
      return null;
    }

    setCookie(
      event,
      "access-token",
      tokens.accessToken,
      authCookieOptions(ACCESS_TOKEN_MAX_AGE),
    );
    if (tokens.refreshToken) {
      setCookie(
        event,
        "refresh-token",
        tokens.refreshToken,
        authCookieOptions(REFRESH_TOKEN_MAX_AGE),
      );
    }
    return tokens.accessToken;
  }
}

export default AuthService;
