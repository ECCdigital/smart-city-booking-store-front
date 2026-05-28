import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const { public: publicRoles } = getQuery(event);

  if (!tenantID) {
    throw createError({
      statusCode: 400,
      statusMessage: "tenantID is required",
    });
  }

  const accessToken = getCookie(event, "access-token");
  if (!accessToken) {
    return [];
  }

  const publicFlag = publicRoles === undefined ? "true" : String(publicRoles);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/roles/tenant?public=${publicFlag}`,
    { method: "GET" }
  );

  if (error) {
    // Treat unauthorized / forbidden as "no roles" so the UI can fall back gracefully.
    if (error.status === 401 || error.status === 403) {
      return [];
    }
    console.error("Error fetching tenant user roles:", error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch tenant user roles",
      data: error.message,
    });
  }

  return data;
});
