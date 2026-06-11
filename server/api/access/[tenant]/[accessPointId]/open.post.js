import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const accessPointId = getRouterParam(event, "accessPointId");
  const { bookingId } = getQuery(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenant}/access/${accessPointId}/open`,
    {
      method: "POST",
      query: { bookingId },
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to open access point",
    });
  }

  return data;
});
