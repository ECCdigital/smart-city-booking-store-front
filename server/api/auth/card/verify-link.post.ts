import type { UpstreamError } from "~~/server/utils/upstreamError";

export default defineEventHandler(async (event) => {
    const { token, id } = await readBody(event);
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    const sanitizedToken = String(token).trim();
    const sanitizedId = String(id).trim().toLowerCase();

    try {
        const response = await $fetch<unknown>(`${API_BASE_URL}/auth/card/link`, {
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
    } catch (err) {
        const error = err as UpstreamError;
        console.error("Error verifying card:", error);
        throw createError({
            success: false,
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.data?.message || "Card link verification failed",
        });
    }
});