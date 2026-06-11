import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const query =  getQuery(event);


  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookables/${bookableID}/availability?startDate=${query.start}&endDate=${query.end}&amount=${query.amount}`,
    {
      method: "GET",
    }
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to check bookable availability",
    });
  }

  return data;
});
