import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const body = await readBody(event);

  try {
    return await serverFetch(
      event,
      `/api/${tenantID}/bookables/${bookableID}/occupancy?timeBegin=${body.start}&timeEnd=${body.end}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to check bookable availability",
      data: error.message,
    });
  }
});
