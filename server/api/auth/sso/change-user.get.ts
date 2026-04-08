import {
    getKeycloakConfig,
    getKeycloakEndpoints,
} from "~~/server/utils/keycloak";

export default defineEventHandler(async (event) => {
    const config = await getKeycloakConfig(event);
    const endpoints = getKeycloakEndpoints(config.serverUrl, config.realm);
    const query = getQuery(event);
    const redirect = (query.redirect as string) || "/";

    const pendingRefresh = getCookie(event, "kc-pending-refresh");

    // Pending Cookies löschen
    deleteCookie(event, "kc-pending-token");
    deleteCookie(event, "kc-pending-refresh");
    deleteCookie(event, "kc-pending-redirect");

    const ssoLoginUrl = `${getRequestURL(event).origin}/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`;

    const logoutUrl = new URL(endpoints.logout);
    logoutUrl.searchParams.set("client_id", config.publicClient);
    logoutUrl.searchParams.set("post_logout_redirect_uri", ssoLoginUrl);

    if (pendingRefresh) {
        logoutUrl.searchParams.set("refresh_token", pendingRefresh);
    }

    return sendRedirect(event, logoutUrl.toString());
});