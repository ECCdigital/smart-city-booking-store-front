import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");

  const { data, error } = await serverFetch(event, `/api/tenants/public`, {
    method: "GET",
  });
  if (error) {
      console.log(error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch Tenants",
      data: error.message,
    });
  }

  const tenant = data.find((tenant) => tenant.id === tenantID);

  return tenant;
});
