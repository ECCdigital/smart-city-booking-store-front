import { proxyErrorOf, upstreamErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async () => {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  try {
    const response = await $fetch(`${API_BASE_URL}/api/tenants/public`, {
      params: {
        publicInstance: true,
      },
      method: "GET",
      server: true,
    });
    return response;
  } catch (error) {
    throw createError(
      proxyErrorOf(upstreamErrorOf(error), "Failed to fetch tenants"),
    );
  }
});
