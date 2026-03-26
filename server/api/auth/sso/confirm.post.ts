export default defineEventHandler(async (event) => {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();
    const pendingToken = getCookie(event, "kc-pending-token");
    const pendingRefresh = getCookie(event, "kc-pending-refresh");

    if (!pendingToken) {
        throw createError({
            statusCode: 400,
            statusMessage: "No pending SSO session. Please start the login again.",
        });
    }

    try {
        const response: any = await $fetch(
            `${API_BASE_URL}/auth/sso/signin`,
            {
                method: "POST",
                body: { token: pendingToken },
            }
        );

        deleteCookie(event, "kc-pending-token");
        deleteCookie(event, "kc-pending-refresh");
        deleteCookie(event, "kc-pending-redirect");

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
                user: response.user,
                permissions: response.permissions,
            },
        };
    } catch (error: any) {
        deleteCookie(event, "kc-pending-token");
        deleteCookie(event, "kc-pending-refresh");
        deleteCookie(event, "kc-pending-redirect");

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: "SSO confirmation failed",
        });
    }
});