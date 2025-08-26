import { apiFetch } from "~~/server/api/utils/apiFetch.js";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");

  try {
    const fetchedEvents = await apiFetch(event, `/json/${tenantID}/events/`, {
      method: "GET",
    });

    return fetchedEvents;
  } catch (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch events",
      data: error.message,
    });
  }
});
