import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const bookableID = getRouterParam(event, "bookableID");
  const tenantID = getQuery(event).tenantID;

  if (!tenantID) {
    throw createError({
      statusCode: 400,
      statusMessage: "tenantID is required",
    });
  }

  const { data } = await serverFetch(
    event,
    `/api/v2/${tenantID}/checkout/permissions/${bookableID}`,
  );


  return data;
});
