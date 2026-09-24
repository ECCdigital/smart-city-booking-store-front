import { serverFetch } from "../../utils/serverFetch.ts";

/**
 * The access points of one booking. The backend body is forwarded unchanged:
 * `{ success, data: [points], accessEligibility }` - the decision the backend
 * computes for that booking travels as a sibling of the list (backend 4.3),
 * and the client reads both (`readAccessPointsAnswer`). Nothing is picked
 * out here, so a field the backend adds next reaches the client as well.
 */
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
