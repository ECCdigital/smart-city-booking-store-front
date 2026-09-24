import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const bookableID = getRouterParam(event, "bookableID");
  const { tenantID } = getQuery(event);

  if (!tenantID) {
    throw createError({
      statusCode: 400,
      statusMessage: "tenantID is required",
    });
  }

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/public/${bookableID}`,
    {
      method: "GET",
    }
  );

  // A 404 stays a 404 ("not available"), a failing backend stays an error.
  if (error) {
    throw createError(proxyErrorOf(error, "Failed to fetch bookable"));
  }

  return data;
});
