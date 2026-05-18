export default defineEventHandler(async (event) => {
  const { email, resetUrl } = await readBody(event);
  const { apiBaseUrl: API_BASE_URL, userBaseUrl: USER_BASE_URL } =
    useRuntimeConfig();

  const sanitizedEmail = String(email || "").trim().toLowerCase();

  if (!sanitizedEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email is required",
    });
  }

  try {
    const response = await $fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      body: {
        id: sanitizedEmail,
        resetUrl: resetUrl || `${USER_BASE_URL}/password/reset`,
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
      statusMessage:
        error.response?.data?.message || "Password reset request failed",
    });
  }
});
