import {
    getKeycloakConfig,
    getKeycloakEndpoints,
} from "~~/server/utils/keycloak";

export default defineEventHandler(async (event) => {
    const refreshToken = getCookie(event, "refresh-token");

    if (refreshToken) {
        try {
            const config = await getKeycloakConfig();
            const endpoints = getKeycloakEndpoints(
                config.serverUrl,
                config.realm
            );

            await $fetch(endpoints.logout, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: config.publicClient,
                    refresh_token: refreshToken,
                }).toString(),
            });
        } catch (err) {
            console.error("Keycloak logout error:", err);
        }
    }

    deleteCookie(event, "access-token");
    deleteCookie(event, "refresh-token");
    deleteCookie(event, "auth-type");

    return { success: true };
});