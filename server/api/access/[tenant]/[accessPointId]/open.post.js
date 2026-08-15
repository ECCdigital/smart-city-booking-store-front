import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const accessPointId = getRouterParam(event, "accessPointId");
  const { bookingId } = getQuery(event);
  // Carries `evidence` and `channel` for access points with validation rules.
  const body = await readBody(event).catch(() => null);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenant}/access/${accessPointId}/open`,
    {
      method: "POST",
      query: { bookingId },
      body: body ?? {},
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
