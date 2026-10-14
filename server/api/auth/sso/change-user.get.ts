import {
    getKeycloakConfig,
    getKeycloakEndpoints,
    getPublicOrigin,
} from "~~/server/utils/keycloak";
import { logger } from "~~/server/api/utils/logger.js";

/**
 * „Benutzer wechseln“ on /sso/confirm: ends the pending Keycloak session in
 * the background, as the SSO sign-out does, then starts the SSO sign-in
 * again. The refresh token stays out of the address, and Keycloak's
 * „Do you want to log out?“ does not come up (ECCdigital/tickets#273).
 *
 * Without a session ended that way, the browser goes through Keycloak's
 * logout page instead, still without a token: otherwise Keycloak would sign
 * the same person in again.
 */
export default defineEventHandler(async (event) => {
    const config = await getKeycloakConfig(event);
    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);
    const query = getQuery(event);
    const redirect = safeReturnTarget(query.redirect);

    const pendingRefresh = getCookie(event, "kc-pending-refresh");

    // Pending Cookies löschen
    deleteCookie(event, "kc-pending-token");
    deleteCookie(event, "kc-pending-refresh");
    deleteCookie(event, "kc-pending-redirect");

    // Fixed path, known to the Admin UI and the backend: see login.get.ts.
    const ssoLoginPath = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`;

    if (pendingRefresh) {
        try {
            await $fetch(endpoints.logout, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: config.publicClient,
                    refresh_token: pendingRefresh,
                }).toString(),
            });
            return sendRedirect(event, ssoLoginPath);
        } catch (err) {
            logger.error({ err }, "Keycloak change-user logout failed");
        }
    }

    const logoutUrl = new URL(endpoints.logout);
    logoutUrl.searchParams.set("client_id", config.publicClient);
    logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        `${getPublicOrigin(event)}${ssoLoginPath}`
    );

    return sendRedirect(event, logoutUrl.toString());
});
