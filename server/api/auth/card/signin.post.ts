export default defineEventHandler(async (event) => {
    const { appId, publicId, secret } = await readBody(event);
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    if (!appId || !publicId || !secret) {
        throw createError({
            statusCode: 400,
            statusMessage: "appId, publicId, and secret are required",
        });
    }

    try {
        const response = await $fetch<any>(`${API_BASE_URL}/auth/card/signin`, {
            method: "POST",
            body: { appId, publicId, secret },
        });

        if (response.requiresRegistration) {
            return {
                success: true,
                data: {
                    requiresRegistration: true,
                    prefill: response.prefill,
                    cardInfo: response.cardInfo,
                },
            };
        }

        const { accessToken, refreshToken, user, permissions } = response;

        setCookie(event, "access-token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        setCookie(event, "refresh-token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return {
            success: true,
            data: {
                requiresRegistration: false,
                user,
                permissions,
            },
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage:
                error.response?.data?.message || "Card authentication failed",
            data: {
                reason: error.response?.data?.reason,
            },
        });
    }
});