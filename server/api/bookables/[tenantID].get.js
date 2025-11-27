import {apiFetch} from "~~/server/api/utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");

  try {
      return await apiFetch(
        event,
        `/json/${tenantID}/bookables/`,
        {
            method: "GET",
        },
    );
  } catch (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch bookables",
      data: error.message,
    });
  }
});
