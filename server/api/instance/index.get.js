export default defineEventHandler(async (event) => {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  try {
    const response = await $fetch(`${API_BASE_URL}/api/instances/public`, {
      method: "GET",
      server: true,
    });

    return response;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch instance",
      data: error.message,
    });
  }
});
