export default defineEventHandler(async (event) => {
    const { token, id } = await readBody(event);
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    const sanitizedToken = String(token).trim();
    const sanitizedId = String(id).trim().toLowerCase();

    try {
        const response = await $fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: "POST",
            body: {
                token: sanitizedToken,
                id: sanitizedId,
            },
        });

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        throw createError({
            success: false,
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.data?.message || "Email verification failed",
        });
    }
});