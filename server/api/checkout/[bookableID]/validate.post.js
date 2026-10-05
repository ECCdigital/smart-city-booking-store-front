import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const bookableID = getRouterParam(event, "bookableID");
  const body = await readBody(event);

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${body.tenantID}/checkout/validate/${bookableID}`,
    {
      method: "POST",
      body,
    }
  );

  if (error) {
    throw createError(proxyErrorOf(error));
  }

  return data;
});
