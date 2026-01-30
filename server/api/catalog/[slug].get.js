import { logger } from "../utils/logger";
import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/catalog/[slug].get" });

  const slug = getRouterParam(event, "slug");

  try {
    const fetchedCatalog = await serverFetch(event, `/api/catalog/${slug}`, {
      method: "GET",
    });

    return fetchedCatalog;
  } catch (error) {
    log.error(`Failed to fetch catalog for slug ${slug}:`, error);
    console.error(error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch catalog",
      data: error.message,
    });
  }
});
