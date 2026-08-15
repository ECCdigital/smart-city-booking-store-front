import { serverFetch } from "../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const { bookingId } = getQuery(event);

  const { data, error } = await serverFetch(event, `/api/${tenant}/access`, {
    method: "GET",
    query: { bookingId },
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch access points",
    });
  }

  return data;
});
