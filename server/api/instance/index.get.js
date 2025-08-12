export default defineEventHandler(async (event) => {
  const { biletadoBaseUrl } = useRuntimeConfig();

  try {
    const response = await $fetch(`${biletadoBaseUrl}/api/instances`, {
      params: {
        publicInstance: true,
      },
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
