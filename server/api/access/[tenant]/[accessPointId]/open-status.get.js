import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const accessPointId = getRouterParam(event, "accessPointId");
  const { bookingId, openProcessId } = getQuery(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenant}/access/${accessPointId}/open-status`,
    {
      method: "GET",
      query: { bookingId, openProcessId },
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch open process status",
    });
  }

  return data;
});
