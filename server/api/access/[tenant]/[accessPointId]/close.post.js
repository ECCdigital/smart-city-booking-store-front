import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const accessPointId = getRouterParam(event, "accessPointId");
  const { bookingId } = getQuery(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenant}/access/${accessPointId}/close`,
    {
      method: "POST",
      query: { bookingId },
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to close access point",
      // The backend's error body, so the client can read Lock Busy
      // (`code: "lock_busy"` on a 423) off the thrown error.
      data: error.data,
    });
  }

  return data;
});
