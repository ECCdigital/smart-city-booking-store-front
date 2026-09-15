import type { UpstreamError } from "~~/server/utils/upstreamError";
import type { CardMethod } from "~~/shared/types/api";

export default defineEventHandler(async () => {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    try {
        const response = await $fetch<{ methods: CardMethod[] }>(
            `${API_BASE_URL}/auth/card-methods`,
        );
        return { success: true, data: response.methods };
    } catch (err) {
        const error = err as UpstreamError;
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage:
                error.response?.data?.message || "Failed to load card auth methods",
        });
    }
});