import { logger } from "../utils/logger";
import { apiFetch } from "~~/server/api/utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/catalog/[slug].get" });

  try {
    const fetchedCatalog = await apiFetch(event, `/api/catalog/public`, {
      method: "GET",
    });

    return fetchedCatalog;
  } catch (error) {
    log.error(`Failed to fetch instance catalog:`, error);
    console.error(error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch catalog",
      data: error.message,
    });
  }
});
