import {
    getKeycloakConfig,
} from "~~/server/utils/keycloak";

export default defineEventHandler(async (event) => {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
    const pendingToken = getCookie(event, "kc-pending-token");
    const pendingRefresh = getCookie(event, "kc-pending-refresh");

    const body = await readBody(event).catch(() => ({}));
    const legalAcceptance = body?.legalAcceptance;

    if (!pendingToken) {
        throw createError({
            statusCode: 400,
            statusMessage: "No pending SSO token. Please start the SSO flow again.",
        });
    }

    try {
        // 1. Registrieren
        await $fetch(`${API_BASE_URL}/auth/sso/signup`, {
            method: "POST",
            body: {
                token: pendingToken,
                ...(legalAcceptance ? { legalAcceptance } : {}),
            },
        });

        // 2. Direkt einloggen
        const loginResponse: any = await $fetch(
            `${API_BASE_URL}/auth/sso/signin`,
            {
                method: "POST",
                body: { token: pendingToken },
            }
        );

        // 3. Pending Cookies löschen
        deleteCookie(event, "kc-pending-token");
        deleteCookie(event, "kc-pending-refresh");

        // 4. Auth Cookies setzen
        const secure = process.env.NODE_ENV === "production";

        setCookie(event, "access-token", pendingToken, {
            httpOnly: true,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        if (pendingRefresh) {
            setCookie(event, "refresh-token", pendingRefresh, {
                httpOnly: true,
                secure,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });
        }

        setCookie(event, "auth-type", "keycloak", {
            httpOnly: false,
            secure,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return {
            success: true,
            data: {
                user: loginResponse.user,
                permissions: loginResponse.permissions,
            },
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || "SSO registration failed",
        });
    }
});