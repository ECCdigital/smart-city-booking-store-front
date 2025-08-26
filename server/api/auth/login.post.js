export default defineEventHandler(async (event) => {
  const { id, password } = await readBody(event);
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  try {


    const response = await $fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      body: { id, password },
    });

    const { accessToken, refreshToken, user, permissions } = response;

    console.log("Login successful:", { accessToken, refreshToken });

    setCookie(event, "access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });

    setCookie(event, "refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      data: {
        user,
        permissions,
      },
    };
  } catch (error) {
    throw createError({
      success: false,
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.data?.message || "Login failed",
    });
  }
});
