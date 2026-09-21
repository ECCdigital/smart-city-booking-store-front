import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const tenantID = body?.tenantID;

  if (!tenantID || typeof tenantID !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenantID",
    });
  }

  if (!Array.isArray(body?.bookableItems) || body.bookableItems.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing bookableItems",
    });
  }

  if (!Array.isArray(body?.bookingAttempts) || body.bookingAttempts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing bookingAttempts",
    });
  }

  const checkoutBody = { ...body };
  delete checkoutBody.tenantID;

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(tenantID)}/checkout/validate-group`,
    {
      method: "POST",
      body: checkoutBody,
    },
  );

  if (error) {
    throw createError(proxyErrorOf(error));
  }

  return data;
});
