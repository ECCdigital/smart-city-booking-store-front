import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const query = getQuery(event);

  const params = new URLSearchParams();
  if (query.startDate != null && String(query.startDate).trim() !== "") {
    params.set("startDate", String(query.startDate));
  }
  if (query.endDate != null && String(query.endDate).trim() !== "") {
    params.set("endDate", String(query.endDate));
  }
  if (query.amount != null && String(query.amount).trim() !== "") {
    params.set("amount", String(query.amount));
  }

  const queryString = params.toString();
  const path = `/api/${tenantID}/bookables/${bookableID}/block-periods${
    queryString ? `?${queryString}` : ""
  }`;

  const { data, error } = await serverFetch(event, path, {
    method: "GET",
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch block periods",
      data: error.data,
    });
  }

  return data;
});
