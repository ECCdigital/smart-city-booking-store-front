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
 * How long the tokens of a renewal stay at hand for requests that still carry
 * the refresh token it used. The backend revokes a refresh token when it is
 * used, so a second renewal with it fails and ends the session. Requests the
 * browser sends side by side all carry the same cookies; they share one
 * renewal while it runs and take its tokens for a while after, long enough to
 * cover a slow call (a lock command) the browser waits on meanwhile.
 */
const SHARED_RENEWAL_MS = 60_000;

/** A renewal that hangs would hold up every request of the session. */
const RENEWAL_TIMEOUT_MS = 10_000;

/** What the backend or Keycloak answer when they refuse the refresh token. */
const REFUSED_STATUSES = new Set([400, 401, 403]);

/**
 * @typedef {{ accessToken: string, refreshToken?: string }} RenewedTokens
 * @typedef {RenewedTokens | "refused" | "unavailable"} RenewalOutcome
 */

/** @type {Map<string, Promise<RenewalOutcome>>} */
const renewals = new Map();

async function requestLocalTokens(refreshToken) {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
  const response = await $fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    body: { refreshToken },
    timeout: RENEWAL_TIMEOUT_MS,
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
    timeout: RENEWAL_TIMEOUT_MS,
  });
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  };
}

/**
 * One renewal per refresh token, shared by every request that carries it.
 * @returns {Promise<RenewalOutcome>}
 */
function sharedRenewal(refreshToken, authType) {
  const kind = authType === "keycloak" ? "keycloak" : "local";
  const key = `${kind}:${refreshToken}`;
  let renewal = renewals.get(key);
  if (renewal) return renewal;

  renewal = (
    kind === "keycloak"
      ? requestKeycloakTokens(refreshToken)
      : requestLocalTokens(refreshToken)
  ).catch((error) => {
    const status = error?.statusCode;
    logger.warn({ status, authType: kind }, "Token renewal failed");
    return REFUSED_STATUSES.has(status) ? "refused" : "unavailable";
  });
  renewals.set(key, renewal);
  renewal.then((outcome) => {
    if (typeof outcome === "string") {
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
   * @returns {Promise<string | null>} The new access token, or `null`:
   *   - without a refresh token, or when the backend or Keycloak refuse it,
   *     the session is over and its cookies are cleared;
   *   - when they cannot be reached or fail, the cookies stay for a later try.
   */
  static async renewAccessToken(event) {
    const refreshToken = getCookie(event, "refresh-token");
    const tokens = refreshToken
      ? await sharedRenewal(refreshToken, getCookie(event, "auth-type"))
      : "refused";
    if (tokens === "unavailable") return null;
    if (tokens === "refused") {
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
