export default defineEventHandler(async (event) =>{
    const { id, password } = await readBody(event);
    const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

    const sanitizedId = String(id).trim().toLowerCase();
    const sanitizedPassword = String(password).trim();

    try {
        const response = await $fetch(`${API_BASE_URL}/auth/resetpassword`, {
            method: "POST",
            body: {
                id: sanitizedId,
                password: sanitizedPassword,
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
            statusMessage: error.response?.data?.message || "Password reset failed",
        });
    }
})