import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const accessPointId = getRouterParam(event, "accessPointId");
  const query = getQuery(event);

  const { data, error } = await serverFetch(
    event,
    `/api/access/access-points/${accessPointId}/bookings`,
    {
      method: "GET",
      query,
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage:
        error.message || "Failed to fetch bookings for access point",
    });
  }

  return data;
});
