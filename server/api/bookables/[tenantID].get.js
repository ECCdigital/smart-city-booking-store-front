import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");

  const { data, error } = await serverFetch(
    event,
    `/json/${tenantID}/bookables/`,
    {
      method: "GET",
    }
  );
  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch bookables",
      data: error.message,
    });
  }

  return data;
});
