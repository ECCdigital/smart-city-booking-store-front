export function handleError(error, fallbackMessage = "Failed to load") {
  throw createError({
    statusCode: error?.statusCode || 500,
    statusMessage: error?.statusMessage || fallbackMessage,
  });
}
