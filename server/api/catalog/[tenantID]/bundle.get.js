import { apiFetch } from "~~/server/api/utils/apiFetch.js";

export default cachedEventHandler(
  async (event) => {
    const tenantID = getRouterParam(event, "tenantID");
    const { bookableId, eventId, include } = getQuery(event);

    const bundle = await apiFetch(event, `/api/catalog/bundle`, {
      method: "GET",
    });

    const result = { catalog: bundle.catalog, tenants: bundle.tenants };

    const tenantExists = result.tenants.some(
      (tenant) => tenant.id === tenantID
    );

    if (!tenantExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Mandant Not Found",
      });
    }

    if (bookableId) {
      result.bookable = await apiFetch(
        event,
        `/json/${tenantID}/bookables/${bookableId}`,
        { method: "GET" }
      );
      if (!result.bookable) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bookable not Found",
        });
      }
      return result;
    }

    if (eventId) {
      result.event = await apiFetch(
        event,
        `/json/${tenantID}/events/${eventId}`,
        { method: "GET" }
      );
      if (!result.event) {
        throw createError({
          statusCode: 404,
          statusMessage: "Event not Found",
        });
      }
      return result;
    }

    if (include?.includes("bookables")) {
      result.bookables = await apiFetch(event, `/json/${tenantID}/bookables/`, {
        method: "GET",
      });
    }

    if (include?.includes("events")) {
      result.events = await apiFetch(event, `/json/${tenantID}/events/`, {
        method: "GET",
      });
    }

    return result;
  },
  {
    maxAge: 300,
    swr: true,
  }
);
