import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

// Removes a favorite of the signed-in user. Idempotent: 204 whether or not
// there was one, so a double click does no harm.
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const targetType = getRouterParam(event, "targetType");
  const targetId = getRouterParam(event, "targetId");

  const { error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(tenantID)}/favorites/${encodeURIComponent(
      targetType,
    )}/${encodeURIComponent(targetId)}`,
    { method: "DELETE" },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to remove favorite",
      data: error.data,
    });
  }

  setResponseStatus(event, 204);
  return null;
});
