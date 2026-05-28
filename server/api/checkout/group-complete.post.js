import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const tenantID = body?.tenantID;

  if (!tenantID || typeof tenantID !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenantID",
    });
  }

  const simulate =
    body?.simulate === true || String(body?.simulate).toLowerCase() === "true";

  const checkoutBody = { ...body };
  delete checkoutBody.tenantID;
  delete checkoutBody.simulate;

  if (!Array.isArray(checkoutBody?.bookingAttempts) || checkoutBody.bookingAttempts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing bookingAttempts",
    });
  }

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(tenantID)}/checkout/group?simulate=${simulate ? "true" : "false"}`,
    {
      method: "POST",
      body: checkoutBody,
    }
  );

  if (error) {
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
      data: error.data,
    });
  }

  return data;
});
