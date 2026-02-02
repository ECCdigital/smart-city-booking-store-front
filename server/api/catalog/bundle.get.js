import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

const errorMapping = {
  503: {
    statusCode: 400,
    statusMessage: "catalog_disabled",
  },
  401: {
    statusCode: 401,
    statusMessage: "unauthorized",
  },
};

export default createConditionalCachedHandler(
  async (event) => {
    const { bookableId, eventId, include } = getQuery(event);

    const { data, error } = await serverFetch(event, `/api/catalog/bundle`, {
      method: "GET",
    });

    if (error) {
      const mappedError = errorMapping[error.status] || {
        status: error.status || 500,
        message: error.message || "Error fetching catalog bundle",
      };

      throw createError({
        statusCode: mappedError.statusCode,
        statusMessage: mappedError.statusMessage,
      });
    }

    const result = { catalog: data.catalog, tenants: data.tenants };

    if (result.catalog.type === "instance") {
      for (const tenant of result.tenants) {
        try {
          if (bookableId) {
            const { data, error } = await serverFetch(
              event,
              `/json/${tenant.id}/bookables/${bookableId}`,
              { method: "GET" }
            );
            if (!error) {
              result.bookable = data;
              return result;
            }
          }

          if (eventId) {
            const { data, error } = await serverFetch(
              event,
              `/json/${tenant.id}/events/${eventId}`,
              { method: "GET" }
            );
            if (!error) {
              result.event = data;
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
          const { data, error } = await serverFetch(
            event,
            `/json/${tenant.id}/bookables/`,
            { method: "GET" }
          );
          if (!error) {
            result.bookables.push(...data);
          }
        }
      }

      if (include?.includes("events")) {
        result.events = [];
        for (const tenant of result.tenants) {
          const { data, error } = await serverFetch(
            event,
            `/json/${tenant.id}/events/`,
            { method: "GET" }
          );
          if (!error) {
            result.events.push(...data);
          }
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
        const { data, error } = await serverFetch(
          event,
          `/json/${tenantId}/bookables/${bookableId}`,
          { method: "GET" }
        );
        if (!data.bookable || error) {
          throw createError({
            statusCode: 404,
            statusMessage: "Bookable not found",
          });
        }
        result.bookable = data.bookable;
        return result;
      }

      if (eventId) {
        const { data, error } = await serverFetch(
          event,
          `/json/${tenantId}/events/${eventId}`,
          { method: "GET" }
        );
        if (!result.event || error) {
          throw createError({
            statusCode: 404,
            statusMessage: "Event not found",
          });
        }
        result.event = data.event;
        return result;
      }

      if (include?.includes("bookables")) {
        const { data, error } = await serverFetch(
          event,
          `/json/${tenantId}/bookables/`,
          {
            method: "GET",
          }
        );
        if (!error) {
          result.bookables = data.bookables;
        }
      }

      if (include?.includes("events")) {
        const { data, error } = await serverFetch(
          event,
          `/json/${tenantId}/events/`,
          {
            method: "GET",
          }
        );

        if (!error) {
          result.events = data;
        }
      }
    }

    return result;
  },
  { maxAge: 300, swr: true }
);
