import { serverFetch } from "../../utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

/**
 * Occupancy and price of many bookables in one period, one backend request
 * for what the search asked two per bookable before.
 */
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const body = await readBody(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/occupancy`,
    {
      method: "POST",
      body: {
        bookableIds: body?.bookableIds,
        timeBegin: body?.start,
        timeEnd: body?.end,
      },
    },
  );

  if (error) {
    throw createError(
      proxyErrorOf(error, "Failed to check bookable occupancies"),
    );
  }

  return data;
});
