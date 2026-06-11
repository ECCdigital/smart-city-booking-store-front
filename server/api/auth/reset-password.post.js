export default defineEventHandler(async (event) => {
  const { token, password, id } = await readBody(event);
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  const sanitizedToken = String(token || "").trim();
  const sanitizedPassword = String(password || "").trim();

  if (!sanitizedToken || !sanitizedPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token and password are required",
    });
  }

  const body = {
    token: sanitizedToken,
    password: sanitizedPassword,
  };

  if (id) {
    body.id = String(id).trim().toLowerCase();
  }

  try {
    const response = await $fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      body,
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
        error.response?.data?.message || "Password reset failed",
    });
  }
});
