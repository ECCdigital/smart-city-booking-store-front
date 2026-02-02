import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

export default createConditionalCachedHandler(
  async (event) => {
    const tenantID = getRouterParam(event, "tenantID");
    const { bookableId, eventId, include } = getQuery(event);

    const { data, error } = await serverFetch(event, `/api/catalog/bundle`, {
      method: "GET",
    });

    if (error) {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: "Failed to fetch catalog bundle",
        data: error.message,
      });
    }

    const result = { catalog: data.catalog, tenants: data.tenants };

    const tenantExists = result.tenants.some(
      (tenant) => tenant.id === tenantID
    );

    if (!tenantExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Tenant Not Found",
      });
    }

    if (bookableId) {
      const { data, error } = await serverFetch(
        event,
        `/json/${tenantID}/bookables/${bookableId}`,
        { method: "GET" }
      );
      if (error) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bookable not Found",
        });
      }
      result.bookable = data;
      return result;
    }

    if (eventId) {
      const { data, error } = await serverFetch(
        event,
        `/json/${tenantID}/events/${eventId}`,
        { method: "GET" }
      );
      if (error) {
        throw createError({
          statusCode: 404,
          statusMessage: "Event not Found",
        });
      }
      result.event = data;
      return result;
    }

    if (include?.includes("bookables")) {
      const { data, error } = await serverFetch(
        event,
        `/json/${tenantID}/bookables/`,
        {
          method: "GET",
        }
      );
      if (!error) {
        result.bookables = data;
      }
    }

    if (include?.includes("events")) {
      const { data, error } = await serverFetch(
        event,
        `/json/${tenantID}/events/`,
        {
          method: "GET",
        }
      );
      if (!error) {
        result.events = data;
      }
    }

    return result;
  },
  { maxAge: 300, swr: true }
);
