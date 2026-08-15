import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const couponCode = body?.couponCode != null ? String(body.couponCode).trim() : "";
  const tenantID = body?.tenantID != null ? String(body.tenantID).trim() : "";

  if (!tenantID || !couponCode) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenantID or couponCode",
    });
  }

  const encoded = encodeURIComponent(couponCode);

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${tenantID}/coupon/validate/${encoded}`,
    {
      method: "GET",
    }
  );

  if (error) {
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
    });
  }

  return data;
});
