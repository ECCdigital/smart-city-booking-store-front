import { apiFetch } from "~~/server/api/utils/apiFetch.js";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

export default createConditionalCachedHandler(
  async (event) => {
    const { bookableId, eventId, include } = getQuery(event);

    const bundle = await apiFetch(event, `/api/catalog/bundle`, {
      method: "GET",
    });

    const result = { catalog: bundle.catalog, tenants: bundle.tenants };

    if (result.catalog.type === "instance") {
      for (const tenant of result.tenants) {
        try {
          if (bookableId) {
            result.bookable = await apiFetch(
              event,
              `/json/${tenant.id}/bookables/${bookableId}`,
              { method: "GET" }
            );
            if (result.bookable) {
              return result;
            }
          }

          if (eventId) {
            result.event = await apiFetch(
              event,
              `/json/${tenant.id}/events/${eventId}`,
              { method: "GET" }
            );
            if (result.event) {
              return result;
            }
          }
        } catch (error) {
          // Ignore not found errors
        }
      }

      if (include?.includes("bookables")) {
        result.bookables = [];
        for (const tenant of result.tenants) {
          const tenantBookables = await apiFetch(
            event,
            `/json/${tenant.id}/bookables/`,
            { method: "GET" }
          );
          result.bookables.push(...tenantBookables);
        }
      }

      if (include?.includes("events")) {
        result.events = [];
        for (const tenant of result.tenants) {
          const tenantEvents = await apiFetch(
            event,
            `/json/${tenant.id}/events/`,
            { method: "GET" }
          );
          result.events.push(...tenantEvents);
        }
      }
    }

    if (result.catalog.type === "single") {
      const tenantId = result.catalog?.tenantId;
      if (!tenantId) {
        throw createError({
          statusCode: 404,
          statusMessage: "Catalog or tenant not found",
        });
      }

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
          {
            method: "GET",
          }
        );
      }

      if (include?.includes("events")) {
        result.events = await apiFetch(event, `/json/${tenantId}/events/`, {
          method: "GET",
        });
      }
    }

    return result;
  },
  { maxAge: 300, swr: true }
);
