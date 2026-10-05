import { serverFetch } from "../../../utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookableID = getRouterParam(event, "bookableId");
  const query = getQuery(event);

  if (!tenantID || !bookableID) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenantID or bookableId",
    });
  }

  const safeTenantID = encodeURIComponent(tenantID);
  const safeBookableID = encodeURIComponent(bookableID);

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
  const path = `/api/${safeTenantID}/bookables/${safeBookableID}/block-periods${
    queryString ? `?${queryString}` : ""
  }`;

  const { data, error } = await serverFetch(event, path, {
    method: "GET",
  });

  if (error) {
    throw createError(proxyErrorOf(error, "Failed to fetch block periods"));
  }

  return data;
});
