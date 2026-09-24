import { serverFetch } from "../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenant = getRouterParam(event, "tenant");
  const scanCode = getRouterParam(event, "scanCode");

  const { data, error } = await serverFetch(
    event,
    `/api/${tenant}/access/resolve-scan/${encodeURIComponent(scanCode)}`,
    {
      method: "GET",
    },
  );

  // A code that does not resolve is a soft failure on HTTP 200 and arrives as
  // data, not as an error - only a broken session or a broken server lands here.
  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to resolve scan code",
    });
  }

  return data;
});
