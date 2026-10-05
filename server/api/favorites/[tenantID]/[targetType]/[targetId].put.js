import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

// Marks an offer as a favorite of the signed-in user. Idempotent: the
// backend answers the favorite whether it is new or was already there. The
// backend's error body (`code`, `params`) is passed on, so the client can
// tell `favorite.limit_reached` (409) from an offer it does not reach (404).
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const targetType = getRouterParam(event, "targetType");
  const targetId = getRouterParam(event, "targetId");

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(tenantID)}/favorites/${encodeURIComponent(
      targetType,
    )}/${encodeURIComponent(targetId)}`,
    { method: "PUT" },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to mark favorite",
      data: error.data,
    });
  }

  return data;
});
