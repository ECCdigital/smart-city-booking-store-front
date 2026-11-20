import { serverFetch } from "../../utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";
import { clientIpHeaders, throwIfRateLimited } from "~~/server/utils/rateLimit";

/**
 * Occupancy and price of many bookables in one period, one backend request
 * for what the search asked two per bookable before. The backend limits it
 * per client IP; its `429` is handed on with `Retry-After`.
 */
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const body = await readBody(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/occupancy`,
    {
      method: "POST",
      headers: clientIpHeaders(event),
      body: {
        bookableIds: body?.bookableIds,
        timeBegin: body?.start,
        timeEnd: body?.end,
      },
    },
  );

  if (error) {
    throwIfRateLimited(event, error);
    throw createError(
      proxyErrorOf(error, "Failed to check bookable occupancies"),
    );
  }

  return data;
});
