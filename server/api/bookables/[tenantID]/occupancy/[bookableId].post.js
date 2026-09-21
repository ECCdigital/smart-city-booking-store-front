import { serverFetch } from "../../../utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const body = await readBody(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/${bookableID}/occupancy?timeBegin=${body.start}&timeEnd=${body.end}`,
    {
      method: "GET",
    }
  );

  if (error) {
    throw createError(proxyErrorOf(error, "Failed to check bookable availability"));
  }

  return data;
});
