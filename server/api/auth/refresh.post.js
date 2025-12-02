import AuthService from "~~/server/service/AuthService.js";

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, "refresh-token");

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "No refresh token",
    });
  }

  try {
    const { success } = await AuthService.refreshToken(event, refreshToken);

    if (!success) {
      throw createError({
        statusCode: 401,
        statusMessage: "Token refresh failed",
      });
    }

    return { success: true };
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Token refresh failed",
    });
  }
});
