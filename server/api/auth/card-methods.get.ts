export default defineEventHandler(async () => {
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    try {
        const response = await $fetch<{ methods: any[] }>(
            `${API_BASE_URL}/auth/card-methods`,
        );
        return { success: true, data: response.methods };
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage:
                error.response?.data?.message || "Failed to load card auth methods",
        });
    }
});