import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const bookableID = getRouterParam(event, "bookableID");
  const { tenantID } = getQuery(event, "tenantID");

  const { data } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/public/${bookableID}`,
    {
      method: "GET",
    }
  );

  return data;
});
