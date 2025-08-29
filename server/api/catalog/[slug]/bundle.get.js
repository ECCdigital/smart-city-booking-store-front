// server/api/catalog/[slug].get.ts
import { apiFetch } from "~~/server/api/utils/apiFetch.js";

export default cachedEventHandler(
  async (event) => {
    const slug = getRouterParam(event, "slug");
    const { bookableId, eventId, include } = getQuery(event);

    try {
      const catalog = await apiFetch(event, `/api/catalog/${slug}`, {
        method: "GET",
      });

      const tenantId = catalog?.tenantId;
      if (!tenantId) {
        throw createError({
          statusCode: 404,
          statusMessage: "Catalog or tenant not found",
        });
      }

      const result = { catalog };

      if (bookableId) {
        result.bookable = await apiFetch(
          event,
          `/json/${tenantId}/bookables/${bookableId}`,
          { method: "GET" }
        );
        if (!result.bookable) {
          throw createError({
            statusCode: 404,
            statusMessage: "Bookable not found",
          });
        }
        return result;
      }

      if (eventId) {
        result.event = await apiFetch(
          event,
          `/json/${tenantId}/events/${eventId}`,
          { method: "GET" }
        );
        if (!result.event) {
          throw createError({
            statusCode: 404,
            statusMessage: "Event not found",
          });
        }
        return result;
      }

      if (include?.includes("bookables")) {
        result.bookables = await apiFetch(
          event,
          `/json/${tenantId}/bookables/`,
          { method: "GET" }
        );
      }

      if (include?.includes("events")) {
        result.events = await apiFetch(event, `/json/${tenantId}/events/`, {
          method: "GET",
        });
      }

      return result;
    } catch (error) {
      console.error("Error fetching catalog bundle:", error);
      throw createError({
        statusCode: error.status || 500,
        statusMessage: "Failed to fetch catalog bundle",
        data: error.message,
      });
    }
  },
  {
    maxAge: 300,
    swr: true,
  }
);
