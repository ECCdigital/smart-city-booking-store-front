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

  const { tenantID: _omitTenant, simulate: _omitSim, ...checkoutBody } = body;

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(tenantID)}/checkout?simulate=${simulate ? "true" : "false"}`,
    {
      method: "POST",
      body: checkoutBody,
    }
  );

  console.log("data", JSON.stringify(data));
  console.log("error", error);

  if (error) {
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
      data: error.data,
    });
  }

  return data;
});
