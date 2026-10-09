import AuthService from "~~/server/service/AuthService.js";

export default defineEventHandler(async (event) => {
  if (!getCookie(event, "refresh-token")) {
    throw createError({
      statusCode: 401,
      statusMessage: "No refresh token",
    });
  }

  const accessToken = await AuthService.renewAccessToken(event);
  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Token refresh failed",
    });
  }

  return { success: true };
});
